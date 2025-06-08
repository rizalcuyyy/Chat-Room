export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.clients = new Set();
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const [client, server] = new WebSocketPair();
    this.handleSession(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async logMessage(message) {
    let logs = (await this.state.storage.get("logs")) || [];

    const timestamp = new Date();
    logs.push({
      message,
      timestamp: timestamp.toISOString(),
    });

    await this.state.storage.put("logs", logs);
  }

  formatTimestamp(isoString) {
    const d = new Date(isoString);
    const pad = (n) => n.toString().padStart(2, "0");
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    return `${time} ${date}`;
  }

  handleSession(webSocket) {
    webSocket.accept();
    this.clients.add(webSocket);

    // Kirim chat history ke user baru
    this.state.storage.get("logs").then((logs) => {
      if (logs && logs.length > 0) {
        for (const log of logs) {
          if (webSocket.readyState === WebSocket.OPEN) {
            const formattedTime = this.formatTimestamp(log.timestamp);
            webSocket.send(`[History] ${formattedTime}: ${log.message}`);
          }
        }
      }
    });

    webSocket.addEventListener("message", async (event) => {
      const msg = event.data;
      await this.logMessage(msg);

      // Broadcast pesan ke semua client kecuali pengirim
      for (const client of this.clients) {
        if (client !== webSocket && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }
    });

    webSocket.addEventListener("close", () => {
      this.clients.delete(webSocket);
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/logs") {
      const id = env.CHAT_ROOM.idFromName("global-room");
      const obj = env.CHAT_ROOM.get(id);

      const logs = (await obj.state.storage.get("logs")) || [];
      return new Response(JSON.stringify(logs, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = env.CHAT_ROOM.idFromName("global-room");
    const obj = env.CHAT_ROOM.get(id);
    return obj.fetch(request);
  },
};
