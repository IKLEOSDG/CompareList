type Env = { FILES: R2Bucket; PROJECT_KEY: string };
const allowed = (request: Request, env: Env) =>
  request.headers.get("X-Project-Key") === env.PROJECT_KEY;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!allowed(request, env))
    return new Response("Unauthorized", { status: 401 });
  if (!request.body) return new Response("Empty upload", { status: 400 });
  const name = new URL(request.url).searchParams.get("name") || "upload.bin";
  const extension = name.includes(".")
    ? `.${name
        .split(".")
        .pop()!
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 8)}`
    : "";
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
  await env.FILES.put(key, request.body, {
    httpMetadata: {
      contentType:
        request.headers.get("Content-Type") || "application/octet-stream",
    },
  });
  return new Response(JSON.stringify({ url: `/api/files/${key}` }), {
    headers: { "Content-Type": "application/json" },
  });
};
