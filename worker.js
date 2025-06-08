export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      // Tampilkan UI HTML simpel
      const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Chat Room</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; max-width: 600px; margin: auto; }
            #messages { height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 5px; }
            input, button { padding: 10px; font-size: 16px; margin-top: 5px; width: 100%; box-sizing: border-box; }
          </style>
        </head>
        <body>
          <h1>Chat Room</h1>
          <div id="messages"></div>
          <input type="text" id="msgInput" placeholder="Ketik pesan..." />
          <button onclick="sendMessage()">Kirim</button>

          <script>
            async function loadMessages() {
              const res = await fetch('/messages');
              const messages = await res.json();
              const container = document.getElementById('messages');
              container.innerHTML = messages.map(m => \`<div><b>[\${new Date(m.timestamp).toLocaleString()}]</b> \${m.text || 'Pesan kosong'}</div>\`).join('');
              container.scrollTop = container.scrollHeight;
            }

            async function sendMessage() {
              const input = document.getElementById('msgInput');
              if (!input.value.trim()) return alert('Pesan tidak boleh kosong!');
              await fetch('/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input.value.trim() }),
              });
              input.value = '';
              loadMessages();
            }

            setInterval(loadMessages, 3000);
            loadMessages();
          </script>
        </body>
        </html>
      `;
      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    if (request.method === "POST" && url.pathname === "/send") {
      try {
        const data = await request.json();
        data.timestamp = new Date().toISOString();

        const existing = await env.CHAT_LOG.get("messages");
        const messages = existing ? JSON.parse(existing) : [];

        messages.push(data);
        await env.CHAT_LOG.put("messages", JSON.stringify(messages));

        return new Response("Pesan disimpan", { status: 200 });
      } catch (err) {
        return new Response("JSON invalid", { status: 400 });
      }
    }

    if (request.method === "GET" && url.pathname === "/messages") {
      const stored = await env.CHAT_LOG.get("messages");
      return new Response(stored || "[]", {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("404 Not Found", { status: 404 });
  },
};
