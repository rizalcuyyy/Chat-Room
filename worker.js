export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Simpan pesan baru
    if (request.method === "POST" && url.pathname === "/send") {
      try {
        const data = await request.json();
        data.timestamp = new Date().toISOString();

        // Ambil pesan lama
        const existing = await env.CHAT_LOG.get("messages");
        const messages = existing ? JSON.parse(existing) : [];

        messages.push(data);

        // Simpan kembali ke KV
        await env.CHAT_LOG.put("messages", JSON.stringify(messages));

        return new Response("Pesan disimpan", { status: 200 });
      } catch (err) {
        return new Response("JSON invalid", { status: 400 });
      }
    }

    // Ambil semua pesan
    if (request.method === "GET" && url.pathname === "/messages") {
      const stored = await env.CHAT_LOG.get("messages");
      return new Response(stored || "[]", {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Endpoint tidak dikenali
    return new Response("404 Not Found", { status: 404 });
  },
};
