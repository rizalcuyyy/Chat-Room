// worker.js

export class ChatRoom {
  constructor(state) {
    this.state = state;
    this.clients = [];
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleSession(ws) {
    ws.accept();
    this.clients.push(ws);

    ws.addEventListener("message", (event) => {
      const message = event.data;
      this.broadcast(message, ws);
    });

    ws.addEventListener("close", () => {
      this.clients = this.clients.filter((c) => c !== ws);
    });
  }

  broadcast(message, sender) {
    for (const client of this.clients) {
      if (client !== sender) {
        try {
          client.send(message);
        } catch (err) {
          console.error("Send error", err);
        }
      }
    }
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const id = env.CHAT_ROOM.idFromName("global");
      const stub = env.CHAT_ROOM.get(id);
      return await stub.fetch(req);
    }

    // Fallback: show HTML page
    return new Response(await renderHTML(), {
      headers: { "content-type": "text/html" },
    });
  },
};

async function renderHTML() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Anon Global Chat</title>
    <style>
      body { font-family: sans-serif; background: #111; color: #fff; padding: 20px; }
      #chat { border: 1px solid #555; padding: 10px; height: 400px; overflow-y: auto; background: #222; }
      input { width: 100%; padding: 10px; margin-top: 10px; border: none; border-radius: 5px; }
    </style>
  </head>
  <body>
    <h2>🌍 Anonymous Global Chat</h2>
    <div id="chat"></div>
    <input id="input" placeholder="Type message and hit enter..." autofocus />
    <script>
      const ws = new WebSocket("wss://" + location.host + "/ws");
      const chat = document.getElementById("chat");
      const input = document.getElementById("input");

      ws.onmessage = (msg) => {
        const p = document.createElement("p");
        p.textContent = msg.data;
        chat.appendChild(p);
        chat.scrollTop = chat.scrollHeight;
      };

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          ws.send(input.value);
          input.value = "";
        }
      });
    </script>
  </body>
  </html>`;
}
