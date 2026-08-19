type Env = { DB: D1Database; PROJECT_KEY: string };
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
const allowed = (request: Request, env: Env) =>
  request.headers.get("X-Project-Key") === env.PROJECT_KEY;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env)) return json({ error: "Unauthorized" }, 401);
  const kind = new URL(request.url).searchParams.get("kind");
  const result = kind
    ? await env.DB.prepare(
        "SELECT data FROM project_records WHERE kind = ? ORDER BY updated_at DESC",
      )
        .bind(kind)
        .all<{ data: string }>()
    : await env.DB.prepare(
        "SELECT data FROM project_records ORDER BY updated_at DESC",
      ).all<{ data: string }>();
  return json(result.results.map((row) => JSON.parse(row.data)));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env)) return json({ error: "Unauthorized" }, 401);
  const record = await request.json<Record<string, unknown>>();
  if (!record.id || !record.kind)
    return json({ error: "Missing id or kind" }, 400);
  await env.DB.prepare(
    "INSERT INTO project_records (id, kind, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, data = excluded.data, updated_at = excluded.updated_at",
  )
    .bind(
      String(record.id),
      String(record.kind),
      JSON.stringify(record),
      Date.now(),
    )
    .run();
  return json(record);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env)) return json({ error: "Unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  await env.DB.prepare("DELETE FROM project_records WHERE id = ?")
    .bind(id)
    .run();
  return json({ ok: true });
};
