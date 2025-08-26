#!/usr/bin/env -S deno run --allow-all

import { Command } from "@cliffy/command";
import { generateCommand } from "./src/cli/commands/generate.ts";
import { batchCommand } from "./src/cli/commands/batch.ts";
import { configCommand } from "./src/cli/commands/config.ts";
import { startCommand } from "./src/cli/commands/start.ts";

async function main() {
  try {
    await new Command()
      .name("logo-cli")
      .version("1.0.1")
      .description("Professional logo generator for Claude Code")
      .command("start", startCommand)
      .command("generate", generateCommand)
      .command("batch", batchCommand)
      .command("config", configCommand)
      .parse(Deno.args);
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
