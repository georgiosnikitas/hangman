# GitHub Copilot SDK Demo

This project demonstrates how to use the `@github/copilot-sdk` to build applications powered by GitHub Copilot. It includes a simple connectivity test and an interactive Hangman game where Copilot acts as the game master.

## Prerequisites

- Node.js (Latest LTS version recommended)
- A GitHub account with access to GitHub Copilot

## Installation

1. Clone the repository (if you haven't already).
2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

You can run the TypeScript file directly using `npx tsx`.

### Hangman Game

Play a game of Hangman where Copilot selects a secret word and provides hints.

```bash
npx tsx hangman.ts
```

## Project Structure

- **`hangman.ts`**: The main interactive demo. Uses `readline` for user input and manages a game session with Copilot.
