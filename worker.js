export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      try {
        const data = await request.json();
        data.timestamp = new Date().toISOString();

        // Ambil pesan lama
        let messages = await env.CHAT_LOG.get("messages", { type: "json" });
        if (!messages) messages = [];

        messages.push(data);

        // Simpan ulang ke KV
        await env.CHAT_LOG.put("messages", JSON.stringify(messages));

        return new Response("Message saved", { status: 200 });
      } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
      }
    } else if (request.method === "GET") {
      let messages = await env.CHAT_LOG.get("messages", { type: "json" });
      if (!messages) messages = [];
      return new Response(JSON.stringify(messages), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  },
};
