export async function onRequest() {
  return Response.json({
    success: true,
    service: "beauty-api-pages",
    message: "Cloudflare Pages Functions running"
  });
}
