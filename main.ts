#!/usr/bin/env -S deno run --allow-all

/**
 * @fileoverview Logo CLI - Ultra-simple professional logo generation for Claude Code
 * 
 * This is the main entry point for the Logo CLI tool, designed specifically for seamless
 * integration with Claude Code. The CLI provides a streamlined workflow for generating
 * professional logos through AI assistance with iteration-based design exploration.
 * 
 * Key Features:
 * - One-command Claude Code integration (`start` command)
 * - Batch logo generation with JSON configuration
 * - Iteration-based folder organization
 * - GPT-image-1 AI model integration
 * - Cost-effective logo exploration ($0.04-$0.16 per logo)
 * 
 * @example
 * ```bash
 * # Start Claude Code session
 * deno run --allow-all jsr:@logocli/logo-generator start
 * 
 * # Generate single logo
 * deno run --allow-all jsr:@logocli/logo-generator generate --company "TechCorp" --prompt "modern logo"
 * 
 * # Batch generation
 * deno run --allow-all jsr:@logocli/logo-generator batch --file logos.json --iteration 1
 * ```
 * 
 * @module main
 */

import { Command } from "@cliffy/command";
import { generateCommand } from "./src/cli/commands/generate.ts";
import { batchCommand } from "./src/cli/commands/batch.ts";
import { configCommand } from "./src/cli/commands/config.ts";
import { startCommand } from "./src/cli/commands/start.ts";

async function main() {
  try {
    await new Command()
      .name("logo-cli")
      .version("1.1.2")
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
