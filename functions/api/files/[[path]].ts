type Env = { DB: D1Database };

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const path = Array.isArray(params.path)
    ? params.path.join("/")
    : String(params.path || "");
  const file = await env.DB.prepare(
    "SELECT kind, data FROM project_records WHERE id = ? AND kind LIKE 'file:%'",
  )
    .bind(`file:${path}`)
    .first<{ kind: string; data: ArrayBuffer }>();
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.data, {
    headers: {
      "Content-Type": file.kind.slice(5) || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
