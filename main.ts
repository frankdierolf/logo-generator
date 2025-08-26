#!/usr/bin/env -S deno run --allow-all

import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import { generateCommand } from "./src/cli/commands/generate.ts";
import { wizardCommand } from "./src/cli/commands/wizard.ts";
import { batchCommand } from "./src/cli/commands/batch.ts";
import { templateCommand } from "./src/cli/commands/template.ts";
import { configCommand } from "./src/cli/commands/config.ts";
import { browseCommand } from "./src/cli/commands/browse.ts";

async function main() {
  console.log(colors.cyan.bold("🎨 Professional Logo Generator CLI"));
  console.log(colors.gray("Powered by OpenAI DALL-E"));

  try {
    await new Command()
      .name("logo-cli")
      .version("1.0.0")
      .description("Professional logo generator using DALL-E")
      .globalOption("-v, --verbose", "Enable verbose logging")
      .globalOption("--config <path>", "Path to config file")
      .command("generate", generateCommand)
      .command("wizard", wizardCommand)
      .command("browse", browseCommand)
      .command("batch", batchCommand)
      .command("template", templateCommand)
      .command("config", configCommand)
      .parse(Deno.args);
  } catch (error) {
    console.error(
      colors.red(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
