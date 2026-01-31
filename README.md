# GitHub Copilot SDK Demo

An interactive Hangman game demonstrating the `@github/copilot-sdk` for programmatic GitHub Copilot interaction. Copilot acts as a sassy game master—picking secret words, providing cryptic hints, and delivering entertaining commentary.

## Prerequisites

- Node.js (Latest LTS version recommended)
- A GitHub account with access to GitHub Copilot

## Installation

```bash
npm install
```

## Usage

Run the game directly with:

```bash
npx tsx hangman.ts
```

### Gameplay

- **Guess letters** by typing a single character (A-Z)
- **Request hints** by typing `hint` — Copilot will give you a cryptic, entertaining clue
- You have **6 mistakes** before it's game over
- Copilot celebrates your wins and roasts your losses with theatrical flair 🎭

## How It Works

The game uses the `@github/copilot-sdk` to:

1. **Start a session** with a custom system prompt that sets Copilot's sassy personality
2. **Generate a secret word** — Copilot picks a medium-difficulty English word
3. **Provide hints** — when stuck, Copilot gives cryptic but hilarious clues
4. **React to outcomes** — dynamic win/lose messages based on your performance

## Project Structure

```
hangman.ts      # Single-file application with all game logic
package.json    # ES Modules config with copilot-sdk dependency
tsconfig.json   # TypeScript config (ES2022, NodeNext modules)
```

## Key SDK Patterns

```typescript
const client = new CopilotClient();
await client.start();                    // Initialize connection
const session = await client.createSession({ model: "gpt-4o" });
// ... interact with session ...
await session.destroy();                 // Clean up session
await client.stop();                     // Close connection
```

The SDK uses an event-driven model—see `getResponse()` in [hangman.ts](hangman.ts) for the pattern of accumulating streamed responses.

## Example Session

```
🚀 Connecting to GitHub Copilot...
🎲 Asking Copilot to pick a secret word...

🎭 Welcome to HANGMAN, where dreams come to die and letters come to play!
Type a letter to guess, or 'hint' to beg Copilot for mercy. Let's GO! 🔥

Word: _ _ _ _ _ _
Mistakes: 0/6
Guessed: 
Enter guess or 'hint': A
😬 Wrong! Were you guessing or just keyboard smashing?

Word: _ _ _ _ _ _
Mistakes: 1/6
Guessed: A
Enter guess or 'hint': I
💅 Okay, okay, I see you! That's in the word, genius!

Word: _ _ _ I _ _
Mistakes: 1/6
Guessed: A, I
Enter guess or 'hint': S
✨ Look at you, spelling bee champion! That letter's in there!

Word: S _ _ I _ _
Mistakes: 2/6
Guessed: A, I, O, S
Enter guess or 'hint': N
🎯 BOOM! Correct! Even a broken clock is right twice a day.

Word: S _ _ I N _
Mistakes: 4/6
Guessed: A, E, I, K, N, O, S
Enter guess or 'hint': H
🎪 *dramatic gasp* They CAN be taught! Correct!

Word: S _ H I N _
Mistakes: 5/6
Guessed: A, E, G, H, I, K, N, O, S
Enter guess or 'hint': U
❌ Nope! That letter called in sick today. Try again!

Oh, the tragedy! You've been utterly defeated by a mythical beast of a word! 🦁🦅

The word was **SPHINX**. Just like the riddle-loving creature of legend, 
this word devoured you whole while you were still guessing vowels. 
Dust yourself off, adventurer. Try again... if you dare! 💀🎮
```
