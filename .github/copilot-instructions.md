# GitHub Copilot SDK Demo Project

Interactive Hangman game demonstrating `@github/copilot-sdk` for programmatic GitHub Copilot interaction.

## Architecture

- **Single-file application**: All logic lives in `hangman.ts`
- **ES Modules**: `package.json` has `"type": "module"` - use ESM imports only
- **No build step**: Run TypeScript directly via `npx tsx hangman.ts`

## Copilot SDK Patterns

### Client Lifecycle (CRITICAL)
```typescript
const client = new CopilotClient();
await client.start();        // MUST call before any operations
// ... do work ...
await client.stop();         // MUST call to exit cleanly
```

### Session Management
```typescript
const session = await client.createSession({ model: "gpt-5" });
// ... use session ...
await session.destroy();     // Clean up before client.stop()
```

### Async Response Handling (see `getResponse()` in hangman.ts)
The SDK is event-driven. To get responses:
1. Subscribe to `session.on("assistant.message", ...)` for streaming content
2. Subscribe to `session.on("session.idle", ...)` to know when response is complete
3. **Wrap in Promise** - script will exit prematurely otherwise
4. **Unsubscribe listeners** after each turn to prevent duplicates

```typescript
// Pattern: accumulate chunks, resolve on idle
unsubscribeMessage = session.on("assistant.message", (e) => response += e.data?.content);
unsubscribeIdle = session.on("session.idle", () => { cleanup(); resolve(); });
session.send({ prompt });
```

## Development Commands

```bash
npm install              # Install dependencies
npx tsx hangman.ts       # Run the game
```

## Conventions

- Use `node:` prefix for Node.js built-ins (e.g., `import * as readline from "node:readline"`)
- TypeScript target: ES2022 with NodeNext modules
- Clean up resources in `finally` blocks for reliable shutdown
