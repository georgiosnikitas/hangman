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

async function playGame(word: string, session: any, question: (q: string) => Promise<string>) {
  let guessedLetters = new Set<string>();
  let mistakes = 0;
  const maxMistakes = 6;

  console.log("\nOnly you and Copilot know the game has begun!");
  console.log("Type a letter to guess, or 'hint' to ask Copilot for a clue.");

  while (mistakes < maxMistakes) {
    const displayWord = word
      .split("")
      .map((char) => (guessedLetters.has(char) ? char : "_"))
      .join(" ");

    console.log(`\nWord: ${displayWord}`);
    console.log(`Mistakes: ${mistakes}/${maxMistakes}`);
    console.log(`Guessed: ${Array.from(guessedLetters).sort((a, b) => a.localeCompare(b)).join(", ")}`);

    if (!displayWord.includes("_")) {
      console.log(`\nCONGRATULATIONS! You correctly guessed the word: ${word}`);
      return;
    }

    const input = (await question("Enter guess or 'hint': ")).trim().toUpperCase();

    if (input === "HINT") {
      console.log("\nAsking Copilot for a hint...");
      const hint = await getResponse(
          session, 
          `The user is stuck on the word "${word}". Give a short, cryptic hint about its meaning without revealing the word or its length.`
      );
      console.log(`> Copilot Clue: ${hint}`);
      continue;
    }

    if (input.length !== 1 || !/[A-Z]/.test(input)) {
      console.log("Invalid input. Please enter a single letter A-Z.");
      continue;
    }

    if (guessedLetters.has(input)) {
      console.log(`You already guessed '${input}'.`);
      continue;
    }

    guessedLetters.add(input);

    if (word.includes(input)) {
      console.log(`Using Copilot's wisdom... '${input}' is CORRECT!`);
    } else {
      console.log(`Sorry, '${input}' is NOT in the word.`);
      mistakes++;
    }
  }

  console.log(`\nGAME OVER! The word was: ${word}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

const client = new CopilotClient();

try {
  console.log("Connecting to GitHub Copilot...");
  await client.start();
  const session = await client.createSession({ model: "gpt-5" });

  console.log("Asking Copilot to pick a secret word...");
  const secretWordRaw = await getResponse(
    session, 
    "Pick a random English word (difficulty: medium) for a game of Hangman. Return ONLY the word in uppercase. Do not explain. Do not include spaces or punctuation."
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
