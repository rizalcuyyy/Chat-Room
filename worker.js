export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.messages = [];
  }

  async fetch(request) {
    if (request.method === "POST") {
      try {
        const data = await request.json();
        data.timestamp = new Date().toISOString();
        this.messages.push(data);
        await this.state.storage.put("messages", this.messages);
        return new Response("Message saved", { status: 200 });
      } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
      }
    } else if (request.method === "GET") {
      const stored = await this.state.storage.get("messages");
      return new Response(JSON.stringify(stored || []), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  }
}

export default {
  async fetch(request, env) {
    const id = env.CHAT_ROOM.idFromName("default");
    const obj = env.CHAT_ROOM.get(id);
    return obj.fetch(request);
  },
};
