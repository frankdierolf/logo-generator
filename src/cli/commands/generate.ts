import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import { LogoGenerator } from "../../core/generator.ts";
import { ConfigManager } from "../../infrastructure/config.ts";
import { ImageDownloader } from "../../infrastructure/downloader.ts";
import type {
  AIModel,
  ImageQuality,
  ImageSize,
  Industry,
  LogoRequest,
  LogoStyle,
} from "../../core/types.ts";

// Type validation helpers
function isValidLogoStyle(value: string): value is LogoStyle {
  const validStyles: LogoStyle[] = [
    "modern",
    "vintage",
    "minimal",
    "playful",
    "classic",
    "bold",
    "elegant",
    "tech",
    "geometric",
    "abstract",
    "wordmark",
    "lettermark",
    "pictorial",
    "emblem",
    "combination",
  ];
  return validStyles.includes(value as LogoStyle);
}

function isValidImageSize(value: string): value is ImageSize {
  const validSizes: ImageSize[] = ["1024x1024", "1024x1792", "1792x1024"];
  return validSizes.includes(value as ImageSize);
}

function isValidImageQuality(value: string): value is ImageQuality {
  return value === "standard" || value === "hd";
}

function isValidAIModel(value: string): value is AIModel {
  return value === "gpt-image-1";
}

function isValidIndustry(value: string): value is Industry {
  const validIndustries: Industry[] = [
    "technology",
    "healthcare",
    "finance",
    "retail",
    "education",
    "food",
    "real-estate",
    "consulting",
    "creative",
    "automotive",
    "entertainment",
    "legal",
    "nonprofit",
  ];
  return validIndustries.includes(value as Industry);
}

export const generateCommand = new Command()
  .description("Generate a logo from a text prompt")
  .option("-p, --prompt <text:string>", "Logo description", { required: true })
  .option("-c, --company <name:string>", "Company name", { required: true })
  .option(
    "-s, --style <style>",
    "Visual style (modern, vintage, minimal, playful, classic, bold, elegant, tech, geometric, abstract, wordmark, lettermark, pictorial, emblem, combination)",
    {
      default: "modern",
    },
  )
  .option(
    "-t, --template <template>",
    "Professional template to use (see 'browse' command for full list)",
  )
  .option("-m, --model <model>", "AI model to use (gpt-image-1)", {
    default: "gpt-image-1",
  })
  .option(
    "--size <size>",
    "Image dimensions (1024x1024, 1024x1792, 1792x1024)",
    {
      default: "1024x1024",
    },
  )
  .option("--quality <quality>", "Image quality (standard, hd)", {
    default: "standard",
  })
  .option("-o, --output <dir:string>", "Output directory")
  .option("--variations <count:number>", "Number of variations to generate", {
    default: 1,
  })
  .option("--no-download", "Don't download the image, just show URL")
  .option("--colors <colors:string>", "Comma-separated color preferences")
  .option("--preview", "Generate preview quality first (lower cost)")
  .option("--industry <industry>", "Target industry for smart defaults")
  .action(async (options) => {
    const configManager = new ConfigManager();
    const config = await configManager.load();

    try {
      const generator = new LogoGenerator(configManager.getApiKey());
      const downloader = new ImageDownloader();

      console.log(colors.cyan("🎨 Generating logo..."));
      console.log(colors.gray(`Company: ${options.company}`));
      console.log(colors.gray(`Prompt: ${options.prompt}`));
      console.log(colors.gray(`Style: ${options.style}`));

      // Type casting with validation
      const style = options.style && isValidLogoStyle(options.style)
        ? options.style
        : "modern" as LogoStyle;
      const size = options.size && isValidImageSize(options.size)
        ? options.size
        : "1024x1024" as ImageSize;
      const quality = options.quality && isValidImageQuality(options.quality)
        ? options.quality
        : "standard" as ImageQuality;
      const model = options.model && isValidAIModel(options.model)
        ? options.model
        : "gpt-image-1" as AIModel;
      const industry = options.industry && isValidIndustry(options.industry)
        ? options.industry
        : undefined;

      // GPT-image-1 cost calculation
      const costPerImage = quality === "hd" ? 0.19 : 0.07;

      console.log(colors.gray(`Model: ${model}`));
      console.log(
        colors.gray(
          `Quality: ${quality} ($${costPerImage.toFixed(3)} per image)`,
        ),
      );

      if (options.template) {
        console.log(colors.gray(`Template: ${options.template}`));
      }

      const request: LogoRequest = {
        company: options.company,
        prompt: options.prompt,
        style,
        size,
        quality,
        colors: options.colors
          ? options.colors.split(",").map((c) => c.trim())
          : undefined,
      };

      const generationOptions = {
        style,
        industry,
        size,
        quality,
        model,
        template: options.template,
        colors: request.colors,
      };

      let results;
      if (options.variations > 1) {
        console.log(
          colors.yellow(`Generating ${options.variations} variations...`),
        );
        results = await generator.generateVariations(
          request,
          options.variations,
          generationOptions,
        );
      } else {
        results = [await generator.generate(request, generationOptions)];
      }

      console.log(
        colors.green(`✅ Successfully generated ${results.length} logo(s)`),
      );

      // Display results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log(`\n${colors.bold(`Logo ${i + 1}:`)}`);
        console.log(`  URL: ${result.url}`);
        console.log(`  ID: ${result.metadata.id}`);
        console.log(`  Cost: $${result.metadata.cost.toFixed(3)}`);

        if (result.revisedPrompt) {
          console.log(`  Revised: ${colors.dim(result.revisedPrompt)}`);
        }
      }

      // Download images if requested (check for --no-download flag)
      if (options.download !== false) {
        const outputDir = options.output || config.outputDir || "./logos";
        console.log(colors.yellow(`\n📥 Downloading to ${outputDir}...`));

        const filepaths = await downloader.downloadBatch(results, outputDir);

        console.log(colors.green("✅ Download complete!"));
        filepaths.forEach((path, i) => {
          console.log(`  ${i + 1}. ${path}`);
        });
      }

      // Show total cost
      const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
      console.log(`\n💰 Total cost: $${totalCost.toFixed(3)}`);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(colors.red(`❌ Generation failed: ${errorMessage}`));

      if (errorMessage.includes("API key")) {
        console.log(
          colors.yellow(
            "💡 Set your API key with: logo-cli config --api-key YOUR_KEY",
          ),
        );
      }

      Deno.exit(1);
    }
  });
