import { Command } from "@cliffy/command";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { ConfigManager } from "../../infrastructure/config.ts";
import type { LogoStyle } from "../../core/types.ts";
import { CacheManager } from "../../infrastructure/cache.ts";

export const configCommand = new Command()
  .description("Manage CLI configuration")
  .option("--api-key <key:string>", "Set OpenAI API key")
  .option("--output-dir <dir:string>", "Set default output directory")
  .option("--cache-toggle", "Toggle cache on/off")
  .option("--show", "Show current configuration")
  .action(async (options) => {
    const configManager = new ConfigManager();

    try {
      await configManager.load();

      if (options.apiKey) {
        await configManager.setApiKey(options.apiKey);
        return;
      }

      if (options.outputDir) {
        await configManager.setOutputDir(options.outputDir);
        return;
      }

      if (options.cacheToggle) {
        await configManager.toggleCache();
        return;
      }

      if (options.show) {
        configManager.printConfig();
        return;
      }

      // Interactive configuration
      await interactiveConfig(configManager);
    } catch (error) {
      console.error(
        colors.red(
          `❌ Configuration failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
      Deno.exit(1);
    }
  })
  .command("cache", "Cache management")
  .command("clear", "Clear cache")
  .action(clearCache)
  .command("stats", "Show cache statistics")
  .action(showCacheStats)
  .command("show", "Show current configuration")
  .action(async () => {
    const configManager = new ConfigManager();
    await configManager.load();
    configManager.printConfig();
  });

async function interactiveConfig(configManager: ConfigManager) {
  console.log(colors.cyan.bold("⚙️ Configuration Setup"));

  const config = configManager.get();

  // API Key
  if (!config.apiKey) {
    console.log(colors.yellow("\n🔑 OpenAI API Key Required"));
    console.log(
      colors.gray(
        "Get your API key from: https://platform.openai.com/api-keys",
      ),
    );

    const apiKey = await Input.prompt({
      message: "Enter your OpenAI API key:",
      validate: (value) => value.length > 0 || "API key is required",
    });

    await configManager.setApiKey(apiKey);
  }

  // Output Directory
  const changeOutput = await Confirm.prompt({
    message: `Keep current output directory (${config.outputDir})?`,
    default: true,
  });

  if (!changeOutput) {
    const outputDir = await Input.prompt({
      message: "Enter new output directory:",
      default: config.outputDir || "./logos",
    });

    await configManager.setOutputDir(outputDir);
  }

  // Default Style
  const changeStyle = await Confirm.prompt({
    message: `Keep current default style (${config.defaultStyle})?`,
    default: true,
  });

  if (!changeStyle) {
    const style = await Select.prompt({
      message: "Choose default style:",
      options: [
        { name: "Modern", value: "modern" },
        { name: "Minimal", value: "minimal" },
        { name: "Classic", value: "classic" },
        { name: "Playful", value: "playful" },
        { name: "Bold", value: "bold" },
        { name: "Elegant", value: "elegant" },
      ],
    });

    await configManager.save({ defaultStyle: style as LogoStyle });
  }

  // Cache Settings
  const cacheEnabled = await Confirm.prompt({
    message: `Enable caching to reduce API costs?`,
    default: config.cacheEnabled !== false,
  });

  if (cacheEnabled !== config.cacheEnabled) {
    await configManager.save({ cacheEnabled });
  }

  console.log(colors.green("\n✅ Configuration updated!"));
  configManager.printConfig();
}

async function clearCache() {
  console.log(colors.yellow("🗑️ Clearing cache..."));

  try {
    const cache = new CacheManager();
    await cache.clear();
    console.log(colors.green("✅ Cache cleared successfully"));
  } catch (error) {
    console.error(
      colors.red(
        `❌ Failed to clear cache: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}

async function showCacheStats() {
  try {
    const cache = new CacheManager();
    const stats = await cache.getStats();

    console.log(colors.cyan.bold("📊 Cache Statistics"));
    console.log(`Memory entries: ${stats.memoryEntries}`);
    console.log(`File entries: ${stats.fileEntries}`);
    console.log(`Total size: ${stats.totalSizeMB} MB`);

    if (stats.fileEntries === 0) {
      console.log(colors.gray("Cache is empty"));
    }
  } catch (error) {
    console.error(
      colors.red(
        `❌ Failed to get cache stats: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}
