const CLOUD_KEY = "yj-cloud-key";
const SYNC_KEYS = ["home-select-v2"];
let ready = false;
let timer = 0;
let originalSetItem: typeof Storage.prototype.setItem | null = null;
let lastStatus = { status: "未连接", detail: "" };

const projectKey = () => localStorage.getItem(CLOUD_KEY) || "";
const onlineApi = () =>
  location.protocol === "https:" || location.hostname === "localhost";
const headers = () => ({
  "Content-Type": "application/json",
  "X-Project-Key": projectKey(),
});

function snapshot() {
  const data: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || key === CLOUD_KEY) continue;
    if (key.startsWith("yj-") || SYNC_KEYS.includes(key))
      data[key] = localStorage.getItem(key) || "";
  }
  return data;
}

function report(status: string, detail = "") {
  lastStatus = { status, detail };
  dispatchEvent(
    new CustomEvent("yj-cloud-status", { detail: { status, detail } }),
  );
}

export function getCloudStatus() {
  return lastStatus;
}

async function push() {
  if (!ready || !projectKey() || !onlineApi()) return;
  try {
    report("同步中");
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ data: snapshot(), updatedAt: Date.now() }),
    });
    if (!response.ok) throw new Error(await response.text());
    report(
      "已同步",
      new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  } catch (error) {
    report("仅本机", error instanceof Error ? error.message : "同步失败");
  }
}

function schedulePush() {
  clearTimeout(timer);
  timer = window.setTimeout(push, 900);
}

export async function initCloudSync() {
  if (!onlineApi()) {
    report("本机预览", "部署到 Cloudflare 后启用跨设备同步");
    return;
  }
  if (!projectKey()) {
    report("未连接", "设置项目访问口令后跨设备同步");
    return;
  }
  try {
    report("连接中");
    const response = await fetch("/api/state", { headers: headers() });
    if (response.status === 401) throw new Error("访问口令不正确");
    if (!response.ok) throw new Error(await response.text());
    const remote = (await response.json()) as { data?: Record<string, string> };
    if (remote.data && Object.keys(remote.data).length) {
      Object.entries(remote.data).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      );
    }
    ready = true;
    if (!originalSetItem) {
      originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        originalSetItem?.call(this, key, value);
        if (this === localStorage && key !== CLOUD_KEY) schedulePush();
      };
      addEventListener("pagehide", push);
    }
    report("已同步");
    if (!remote.data || !Object.keys(remote.data).length) await push();
  } catch (error) {
    report("仅本机", error instanceof Error ? error.message : "云端不可用");
  }
}

export function setCloudKey(value: string) {
  localStorage.setItem(CLOUD_KEY, value.trim());
}

export function hasCloudKey() {
  return Boolean(projectKey());
}

const MAX_UPLOAD_BYTES = 1_250_000;

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("照片压缩失败"))),
      "image/jpeg",
      quality,
    ),
  );
}

async function prepareCloudUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    if (file.size > MAX_UPLOAD_BYTES)
      throw new Error("D1 单库模式下附件不能超过 1.2 MB");
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  let result: Blob | null = null;
  for (let round = 0; round < 5; round += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      result = await canvasBlob(canvas, quality);
      if (result.size <= MAX_UPLOAD_BYTES) break;
    }
    if (result && result.size <= MAX_UPLOAD_BYTES) break;
    scale *= 0.78;
  }
  bitmap.close();
  if (!result || result.size > MAX_UPLOAD_BYTES)
    throw new Error("照片过大，请裁剪后重试");
  return new File(
    [result],
    `${file.name.replace(/\.[^.]+$/, "") || "现场照片"}.jpg`,
    { type: "image/jpeg" },
  );
}

export async function uploadCloudFile(file: File): Promise<string> {
  if (!projectKey() || !onlineApi()) throw new Error("请先连接云端同步");
  const upload = await prepareCloudUpload(file);
  const response = await fetch(
    `/api/upload?name=${encodeURIComponent(upload.name)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": upload.type || "application/octet-stream",
        "X-Project-Key": projectKey(),
      },
      body: upload,
    },
  );
  if (!response.ok) throw new Error(await response.text());
  const result = (await response.json()) as { url: string };
  return result.url;
}

export function cloudHeaders() {
  return { "X-Project-Key": projectKey() };
}

export function cloudAvailable() {
  return Boolean(projectKey() && onlineApi());
}
