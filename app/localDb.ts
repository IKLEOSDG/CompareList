export type LocalRecord = {
  id: string;
  kind: "candidate" | "document";
  name: string;
  category?: string;
  brand?: string;
  model?: string;
  size?: string;
  install?: string;
  price?: number;
  note?: string;
  url?: string;
  fileName?: string;
  mime?: string;
  dataUrl?: string;
  createdAt: number;
};

const DB_NAME = "yuejing-renovation";
const STORE = "records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function listLocalRecords(
  kind?: LocalRecord["kind"],
): Promise<LocalRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as LocalRecord[])
          .filter((item) => !kind || item.kind === kind)
          .sort((a, b) => b.createdAt - a.createdAt),
      );
    req.onerror = () => reject(req.error);
  });
}

export async function listRecords(
  kind?: LocalRecord["kind"],
): Promise<LocalRecord[]> {
  const local = await listLocalRecords(kind);
  if (cloudAvailable()) {
    try {
      const response = await fetch(
        `/api/records${kind ? `?kind=${kind}` : ""}`,
        { headers: cloudHeaders() },
      );
      if (response.ok) {
        const remote = (await response.json()) as LocalRecord[];
        if (remote.length) return remote;
        if (local.length)
          await Promise.all(local.map((record) => saveRecord(record)));
      }
    } catch {}
  }
  return local;
}

export async function saveRecord(record: LocalRecord): Promise<void> {
  let saved = record;
  if (cloudAvailable()) {
    try {
      if (saved.dataUrl?.startsWith("data:")) {
        const blob = await (await fetch(saved.dataUrl)).blob();
        const file = new File([blob], saved.fileName || `${saved.id}.webp`, {
          type: saved.mime || blob.type,
        });
        saved = { ...saved, dataUrl: await uploadCloudFile(file) };
        Object.assign(record, saved);
      }
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { ...cloudHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(saved),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch {}
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(saved);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeRecord(id: string): Promise<void> {
  if (cloudAvailable()) {
    try {
      await fetch(`/api/records?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: cloudHeaders(),
      });
    } catch {}
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
import { cloudAvailable, cloudHeaders, uploadCloudFile } from "./cloudSync";
