import { Command } from "@cliffy/command";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { ConfigManager } from "../../infrastructure/config.ts";
import type { LogoStyle } from "../../core/types.ts";

export const configCommand = new Command()
  .description("Manage CLI configuration")
  .option("--api-key <key:string>", "Set OpenAI API key")
  .option("--output-dir <dir:string>", "Set default output directory")
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


  console.log(colors.green("\n✅ Configuration updated!"));
  configManager.printConfig();
}


