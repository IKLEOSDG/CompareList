type Env = { FILES: R2Bucket; PROJECT_KEY: string };

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const path = Array.isArray(params.path)
    ? params.path.join("/")
    : String(params.path || "");
  const object = await env.FILES.get(path);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
};
