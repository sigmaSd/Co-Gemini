import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import * as collections from "jsr:@std/collections";
import $ from "jsr:@david/dax";

const AI_PROMPT =
  `you are an ai assistant, you are on gnome fedora 41, i'm going to give you acess to some commands that you can use by just writing them:
  - [terminal]: to open a terminal
  - [appName] (name): to open an app
  - [text] (text): to send text as is to a terminal maybe or some other app
  - [screenShot]: this will take a screenshot of my pc and send it to you, use it to get more info on what I'm doing so you can help more, '

  lets start with that i'm going to talk to you and if you need do an action, just write the command and it'll automaticlly run
  if I tell you to do something but you can't because u're missing a command, just write what would the command look like and i'll add it then rerun u
  You can chain multiple commands each in a new line
  the command message should start with [Command] in its own line, example
  [Command]
  [terminal]
  [text] ping 8.8.8.8`;

const key = Deno.env.get("API_KEY");
if (!key) throw new Error("No API KEY");
const genAI = new GoogleGenerativeAI(key);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const chat = model.startChat();
await chat.sendMessage(AI_PROMPT);

try {
  while (true) {
    const resp = await chat.sendMessage(
      prompt(">") ?? "",
    );
    const text = resp.response.text();
    console.log(text);
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
        } else if (line.startsWith("[screenShot]")) {
          console.log("taking screenshot");
          const screenshot =
            await $`flameshot full -p /tmp/screenshot.png && base64 -w 0 /tmp/screenshot.png`
              .text();
          // sens screenshot to ai
          const resp = await chat.sendMessage([
            { inlineData: { data: screenshot, mimeType: "image/png" } },
          ]);
          console.log(resp.response.text());
        }
      }
    }
  }
} catch {
  /* ignore */
}

function open(program: string) {
  new Deno.Command(program).spawn();
}
