type Env = { DB: D1Database; PROJECT_KEY: string };
const allowed = (request: Request, env: Env) =>
  request.headers.get("X-Project-Key") === env.PROJECT_KEY;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env))
    return new Response("Unauthorized", { status: 401 });
  const body = await request.arrayBuffer();
  if (!body.byteLength) return new Response("Empty upload", { status: 400 });
  if (body.byteLength > 1_500_000)
    return new Response("文件超过 D1 单库模式的 1.5 MB 上限", { status: 413 });
  const id = crypto.randomUUID();
  const mime = (
    request.headers.get("Content-Type") || "application/octet-stream"
  )
    .replace(/[^a-zA-Z0-9.+\-/]/g, "")
    .slice(0, 100);
  await env.DB.prepare(
    "INSERT INTO project_records (id, kind, data, updated_at) VALUES (?, ?, ?, ?)",
  )
    .bind(`file:${id}`, `file:${mime}`, body, Date.now())
    .run();
  return new Response(JSON.stringify({ url: `/api/files/${id}` }), {
    headers: { "Content-Type": "application/json" },
  });
};
