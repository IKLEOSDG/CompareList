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
  Boolean(
    env.PROJECT_KEY && request.headers.get("X-Project-Key") === env.PROJECT_KEY,
  );

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env)) return json({ error: "Unauthorized" }, 401);
  const row = await env.DB.prepare(
    "SELECT data, updated_at FROM project_state WHERE id = ?",
  )
    .bind("main")
    .first<{ data: string; updated_at: number }>();
  return json(
    row
      ? { data: JSON.parse(row.data), updatedAt: row.updated_at }
      : { data: {}, updatedAt: 0 },
  );
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env)) return json({ error: "Unauthorized" }, 401);
  const body = await request.json<{
    data: Record<string, string>;
    updatedAt?: number;
  }>();
  if (!body.data || JSON.stringify(body.data).length > 2_000_000)
    return json({ error: "Invalid or oversized state" }, 400);
  const updatedAt = Number(body.updatedAt || Date.now());
  await env.DB.prepare(
    "INSERT INTO project_state (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
  )
    .bind("main", JSON.stringify(body.data), updatedAt)
    .run();
  return json({ ok: true, updatedAt });
};
