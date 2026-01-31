import { CopilotClient } from "@github/copilot-sdk";
import * as readline from "node:readline";

// Helper function to handle the conversation turn
async function getResponse(session: any, prompt: string): Promise<string> {
  let fullResponse = "";
  
  return new Promise<void>((resolve, reject) => {
    const onMessage = (event: any) => {
      // Verify the structure of the event data
      if (event.data?.content) {
        fullResponse += event.data.content;
      }
    };
    
    let unsubscribeMessage: () => void;
    let unsubscribeIdle: () => void;

    // We need to clean up listeners to avoid duplicates on the next turn
    const cleanup = () => {
      if (unsubscribeMessage) unsubscribeMessage();
      if (unsubscribeIdle) unsubscribeIdle();
    };

    const onIdle = () => {
      cleanup();
      resolve();
    };

    unsubscribeMessage = session.on("assistant.message", onMessage);
    unsubscribeIdle = session.on("session.idle", onIdle);

    session.send({ prompt }).catch((err: any) => {
      cleanup();
      reject(err);
    });
  }).then(() => {
    return fullResponse.trim();
  });
}

// Pre-cached spicy responses to avoid API latency on every turn
const CORRECT_RESPONSES = [
  "🔥 OH SNAP! You actually got one right! I'm impressed... slightly.",
  "✨ Look at you, spelling bee champion! That letter's in there!",
  "🎯 BOOM! Correct! Even a broken clock is right twice a day.",
  "💅 Okay, okay, I see you! That's in the word, genius!",
  "🎪 *dramatic gasp* They CAN be taught! Correct!",
];

const WRONG_RESPONSES = [
  "💀 Oof. That letter isn't even in the same ZIP code as this word.",
  "😬 Wrong! Were you guessing or just keyboard smashing?",
  "🪦 RIP to that guess. The hangman thanks you for your contribution.",
  "❌ Nope! That letter called in sick today. Try again!",
  "🎭 Dramatic pause... WRONG! The audience gasps!",
];

const DUPLICATE_RESPONSES = [
  "🧠 Hello? You already guessed that! Memory of a goldfish?",
  "🔄 Déjà vu much? That letter's been there, done that!",
  "📝 Check your notes, bestie. Already guessed!",
  "🤦 *facepalm* We've been over this. Try a NEW letter.",
];

const INVALID_RESPONSES = [
  "🤨 One letter. A-Z. It's not rocket science, bestie.",
  "📖 The alphabet has 26 letters. Pick ONE of them.",
  "🎓 Pro tip: type a single letter. Revolutionary, I know.",
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function playGame(word: string, session: any, question: (q: string) => Promise<string>) {
  let guessedLetters = new Set<string>();
  let mistakes = 0;
  const maxMistakes = 6;

  console.log(`\n🎭 Welcome to HANGMAN, where dreams come to die and letters come to play!`);
  console.log(`Type a letter to guess, or 'hint' to beg Copilot for mercy. Let's GO! 🔥`);

  while (mistakes < maxMistakes) {
    const displayWord = word
      .split("")
      .map((char) => (guessedLetters.has(char) ? char : "_"))
      .join(" ");

    console.log(`\nWord: ${displayWord}`);
    console.log(`Mistakes: ${mistakes}/${maxMistakes}`);
    console.log(`Guessed: ${Array.from(guessedLetters).sort((a, b) => a.localeCompare(b)).join(", ")}`);

    if (!displayWord.includes("_")) {
      const winMessage = await getResponse(
        session,
        `The player just WON! They guessed the word "${word}" correctly! Celebrate their victory with an over-the-top, hilarious congratulations. Make them feel like a genius. Keep it short but memorable!`
      );
      console.log(`\n${winMessage}`);
      return;
    }

    const input = (await question("Enter guess or 'hint': ")).trim().toUpperCase();

    if (input === "HINT") {
      console.log("\nAsking Copilot for a hint...");
      const hint = await getResponse(
          session, 
          `The user is stuck on the word "${word}" (they've guessed: ${Array.from(guessedLetters).join(", ") || "nothing yet"}). Give them a spicy, funny hint about its meaning. Be cryptic but entertaining - throw in some sass! Don't reveal the word or its length.`
      );
      console.log(`> ${hint}`);
      continue;
    }

    if (input.length !== 1 || !/[A-Z]/.test(input)) {
      console.log(pick(INVALID_RESPONSES));
      continue;
    }

    if (guessedLetters.has(input)) {
      console.log(pick(DUPLICATE_RESPONSES));
      continue;
    }

    guessedLetters.add(input);

    if (word.includes(input)) {
      console.log(pick(CORRECT_RESPONSES));
    } else {
      console.log(pick(WRONG_RESPONSES));
      mistakes++;
    }
  }

  const loseMessage = await getResponse(
    session,
    `GAME OVER! The player lost with ${maxMistakes} mistakes. The word was "${word}". Give them a dramatic, funny game over message. Reveal the word and roast them for failing, but encourage them to try again. Keep it memorable!`
  );
  console.log(`\n${loseMessage}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

const client = new CopilotClient();

try {
  console.log("🚀 Connecting to GitHub Copilot...");
  await client.start();
  const session = await client.createSession({ 
    model: "gpt-4o",
    systemPrompt: `You are the sassiest, most entertaining Hangman host in the galaxy. Your personality is:
- Witty and playful with a dash of roast energy
- You love dramatic flair and theatrical responses  
- You give hints that are cryptic but hilarious
- Sprinkle in pop culture references and puns
- Keep responses SHORT (1-2 sentences max)
Never reveal the secret word directly!`
  });

  console.log("🎲 Asking Copilot to pick a secret word...");
  const secretWordRaw = await getResponse(
    session, 
    "Pick a random English word (difficulty: medium) for Hangman. Return ONLY the uppercase word, nothing else."
  );
  
  // Clean up the word just in case
  const word = secretWordRaw.replaceAll(/[^A-Z]/g, "").toUpperCase();

  if (word) {
    await playGame(word, session, question);
  } else {
    console.error("Failed to get a valid word from Copilot.");
  }

  await session.destroy();

} catch (error) {
  console.error("An error occurred:", error);
} finally {
  await client.stop();
  rl.close();
}
