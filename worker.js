export class ChatRoom {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/send") {
      const { message } = await request.json();

      if (!message || typeof message !== "string") {
        return new Response("Invalid message", { status: 400 });
      }

      let logs = (await this.state.storage.get("logs")) || [];

      const timestamp = new Date().toISOString();

      logs.push({ message, timestamp });

      await this.state.storage.put("logs", logs);

      return new Response("Message received", { status: 200 });
    }

    if (request.method === "GET" && url.pathname === "/logs") {
      const logs = (await this.state.storage.get("logs")) || [];
      return new Response(JSON.stringify(logs, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const id = env.CHAT_ROOM.idFromName("global-room");
    const obj = env.CHAT_ROOM.get(id);
    return obj.fetch(request);
  },
};
