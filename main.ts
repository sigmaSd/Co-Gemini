import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import * as collections from "jsr:@std/collections";
import $ from "jsr:@david/dax";
import { ChatSession } from "npm:@google/generative-ai";
import * as readline from "node:readline/promises";
import process from "node:process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const AI_PROMPT =
  `You are an AI assistant running on GNOME Fedora 41. You have access to these commands:

Available Commands:
- [terminal]: Opens a new terminal window
- [appName] (name): Launches a specific application
- [text] (text): Sends text input to the active window
- [screenShot]: Captures a screenshot for analysis
- [clipBoard]: Reads the current clipboard content
- [notify] (message): Sends a system notification
- [search] (query): Opens browser with search query
- [file] (path): Opens file with default app
- [keyPress] (keys): Simulates keyboard input
- [window] (action): Controls windows (maximize/minimize/close)
- [listen]: Listens for voice input

To execute commands:
1. Start with [Command] on a new line
2. Each command on its own line
3. You can chain multiple commands
4. If you need a missing command, describe what it should do

Example:
[Command]
[terminal]
[text] ping 8.8.8.8
[keyPress] Enter

I'll analyze your system's output and respond with actions when needed.
Be concise in your commands, speak clearly, and stay focused on the task.

You have to start with [Command] before any other commands so I can detect it.

Note: We can communicate through voice - I can listen to your speech input and respond verbally through the audio interface. This two-way voice interaction is built-in and doesn't require any special commands.`;

const HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Voice Interface</title>
</head>
<body>
    <div id="status">Ready</div>
    <button id="listen">Start Listening</button>
    <script>
        const ws = new WebSocket('ws://' + window.location.host + '/ws');
        const recognition = new webkitSpeechRecognition();
        const synthesis = window.speechSynthesis;

        recognition.continuous = false;
        recognition.lang = 'en-US';

        // Workaround for Chrome's 15-second speech cutoff
        let utteranceTimer;
        function keepSpeechAlive() {
            if (synthesis.speaking) {
                synthesis.pause();
                synthesis.resume();
                utteranceTimer = setTimeout(keepSpeechAlive, 14000);
            }
        }

        function stopSpeaking() {
            synthesis.cancel();
            clearTimeout(utteranceTimer);
        }

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('status').textContent = 'You said: ' + text;
            ws.send(JSON.stringify({ type: 'speech', text }));
        };

        recognition.onend = () => {
            document.getElementById('status').textContent = 'Ready';
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'speak') {
                stopSpeaking();
                const utterance = new SpeechSynthesisUtterance(data.text);

                utterance.onstart = () => {
                    clearTimeout(utteranceTimer);
                    utteranceTimer = setTimeout(keepSpeechAlive, 14000);
                };

                utterance.onend = () => {
                    clearTimeout(utteranceTimer);
                    document.getElementById('status').textContent = 'Ready';
                };

                synthesis.speak(utterance);
            } else if (data.type === 'startListening') {
                stopSpeaking();
                recognition.start();
                document.getElementById('status').textContent = 'Listening...';
            }
        };

        document.getElementById('listen').onclick = () => {
            stopSpeaking();
            recognition.start();
            document.getElementById('status').textContent = 'Listening...';
        };
    </script>
</body>
</html>
`;

async function handleCommands(
  text: string,
  chat: ChatSession,
  onResponse?: (text: string) => void,
) {
  if (text.includes("[Command]")) {
    for (
      const line of collections.dropWhile(
        text.split("\n"),
        (line) => line.startsWith("[Command]"),
      )
    ) {
      if (line.startsWith("[Command]")) continue;
      if (line.startsWith("[terminal]")) {
        console.log("opening terminal");
        open("gnome-terminal");
      } else if (line.startsWith("[appName]")) {
        console.log("opening app");
        open(line.split(/\s+/)[1]);
      } else if (line.startsWith("[text]")) {
        console.log("sending text");
        for (const part of line.slice(6).trim().split(/\s+/)) {
          await $`xdotool type ${part}`.quiet().noThrow();
          await $`xdotool key space`.quiet().noThrow();
        }
      } else if (line.startsWith("[screenShot]")) {
        console.log("taking screenshot");
        const screenshot =
          await $`rm /tmp/screenshot.png; flameshot full -p /tmp/screenshot.png && base64 -w 0 /tmp/screenshot.png`
            .noThrow()
            .text();
        const resp = await chat.sendMessage([
          { inlineData: { data: screenshot, mimeType: "image/png" } },
        ]);
        const responseText = resp.response.text();
        console.log(responseText);
        onResponse?.(responseText);
      } else if (line.startsWith("[clipBoard]")) {
        const clipboard = await $`xclip -o -selection clipboard`.noThrow()
          .text();
        const resp = await chat.sendMessage(`Clipboard: ${clipboard}`);
        const responseText = resp.response.text();
        console.log(responseText);
        onResponse?.(responseText);
      } else if (line.startsWith("[notify]")) {
        await $`notify-send "${line.slice(8)}"`.quiet().noThrow();
      } else if (line.startsWith("[search]")) {
        open("xdg-open", [
          `https://www.google.com/search?q=${
            encodeURIComponent(line.slice(8))
          }`,
        ]);
      } else if (line.startsWith("[file]")) {
        await $`xdg-open "${line.slice(6)}"`.quiet().noThrow();
      } else if (line.startsWith("[keyPress]")) {
        await $`xdotool key ${line.split(/\s+/)[1]}`.quiet().noThrow();
      } else if (line.startsWith("[window]")) {
        const action = line.split(/\s+/)[1];
        if (action === "maximize") {
          await $`xdotool getactivewindow windowmaximize`.quiet().noThrow();
        }
        if (action === "minimize") {
          await $`xdotool getactivewindow windowminimize`.quiet().noThrow();
        }
        if (action === "close") {
          await $`xdotool getactivewindow windowclose`.quiet().noThrow();
        }
      }
    }
  }
}

if (import.meta.main) {
  const key = Deno.env.get("API_KEY");
  if (!key) throw new Error("No API KEY");
  const genAI = new GoogleGenerativeAI(key);

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const chat = model.startChat();
  await chat.sendMessage(AI_PROMPT);

  const connections = new Set<WebSocket>();

  Deno.serve({ port: 8000 }, (req) => {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(req);
      handleWebSocket({ chat, ws: socket, connections });
      return response;
    }

    if (req.method === "POST" && req.url.endsWith("/trigger-listen")) {
      for (const ws of connections) {
        ws.send(JSON.stringify({ type: "startListening" }));
      }
      return new Response("OK");
    }

    return new Response(HTML, {
      headers: { "content-type": "text/html" },
    });
  });

  console.log(
    "Open http://localhost:8000 in your browser to use voice interface",
  );

  try {
    while (true) {
      const resp = await chat.sendMessage(
        await rl.question("> "),
      );
      const text = resp.response.text();
      console.log(text);
      await handleCommands(text, chat);
    }
  } catch {
    /* ignore */
  }
}

function open(program: string, args: string[] = []) {
  new Deno.Command(program, { args }).spawn();
}

async function handleWebSocket({ chat, ws, connections }: {
  chat: ChatSession;
  ws: WebSocket;
  connections: Set<WebSocket>;
}) {
  connections.add(ws);

  try {
    ws.addEventListener("message", async (event) => {
      if (typeof event.data === "string") {
        const data = JSON.parse(event.data);
        if (data.type === "speech") {
          const resp = await chat.sendMessage(data.text);
          const text = resp.response.text();
          console.log("AI:", text);

          ws.send(JSON.stringify({
            type: "speak",
            text: text,
          }));

          await handleCommands(text, chat, (responseText) => {
            ws.send(JSON.stringify({
              type: "speak",
              text: responseText,
            }));
          });
        }
      }
    });

    await new Promise((resolve) => {
      ws.addEventListener("close", () => resolve(undefined));
      ws.addEventListener("error", (e) => {
        console.error("WebSocket error:", e);
        resolve(undefined);
      });
    });
  } finally {
    connections.delete(ws);
  }
}
