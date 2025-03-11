import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";
import * as readline from "node:readline/promises";
import process from "node:process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (import.meta.main) {
  const key = Deno.env.get("GOOGLE_API_KEY");
  if (!key) throw new Error("No API KEY");
  const genAI = new GoogleGenerativeAI(key);

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const chat = model.startChat();

  const msgQ = (async () => {
    await chat.sendMessage(
      "Your an ai assistant, the user will first send the context, then ask quesitons, be as brief and clear as possible",
    );
    await chat.sendMessage(Deno.args[0]);
  })();

  try {
    while (true) {
      const q = await rl.question("> ");
      await msgQ;
      const resp = await chat.sendMessage(q);
      const text = resp.response.text();
      console.log(text);
    }
  } catch {
    /* ignore */
  }
}
