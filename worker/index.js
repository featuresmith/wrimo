export default {
  async fetch(request, env) {
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD") {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        const url = new URL(request.url);
        url.pathname = "/";
        return env.ASSETS.fetch(new Request(url.toString(), request));
      }
    }

    return assetResponse;
  },
};
