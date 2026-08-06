export default {
  async fetch(request: Request, env: any): Promise<Response> {
    try {
      const url = new URL(request.url);
      console.log("[debug] request url:", url.pathname);
      console.log("[debug] USER_CACHE type:", typeof env.USER_CACHE);
      console.log("[debug] D1_DB type:", typeof env.D1_DB);
      console.log("[debug] IMAGE_BUCKET type:", typeof env.IMAGE_BUCKET);
      return new Response("OK: debug endpoint", {
        status: 200, headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("[debug] error:", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }
  }
};
