import { Command } from "@cliffy/command";
import { Checkbox, Confirm, Input, Number, Select } from "@cliffy/prompt";
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

export const wizardCommand = new Command()
  .description("Interactive logo generation wizard")
  .option("-o, --output <dir:string>", "Output directory")
  .action(async (options) => {
    console.log(colors.cyan.bold("🧙‍♂️ Logo Generation Wizard"));
    console.log(colors.gray("Let's create the perfect logo for your brand!\n"));

    try {
      // Initialize configuration
      const configManager = new ConfigManager();
      const config = await configManager.load();

      // Step 1: Basic Information
      console.log(colors.yellow.bold("📋 Step 1: Basic Information"));

      const company = await Input.prompt({
        message: "Company/brand name:",
        validate: (value) => value.length > 0 || "Company name is required",
      });

      const description = await Input.prompt({
        message: "Describe your logo (what it should represent):",
        validate: (value) => value.length > 0 || "Description is required",
      });

      // Step 2: Approach & Industry Selection
      console.log(colors.yellow.bold("\n🎨 Step 2: Approach & Industry"));

      const approach = await Select.prompt({
        message: "Choose your approach:",
        options: [
          {
            name: "🎨 Use Professional Template (Recommended)",
            value: "template",
          },
          { name: "⚡ Quick Custom Style", value: "custom" },
          { name: "🔧 Advanced Manual Control", value: "advanced" },
        ],
      });

      const industry = await Select.prompt({
        message: "Select your industry:",
        options: [
          { name: "Technology", value: "technology" },
          { name: "Healthcare", value: "healthcare" },
          { name: "Finance", value: "finance" },
          { name: "Food & Beverage", value: "food" },
          { name: "Education", value: "education" },
          { name: "Real Estate", value: "real-estate" },
          { name: "Consulting", value: "consulting" },
          { name: "Creative", value: "creative" },
          { name: "Automotive", value: "automotive" },
          { name: "Legal", value: "legal" },
          { name: "Wellness", value: "wellness" },
          { name: "Non-profit", value: "nonprofit" },
          { name: "Other", value: undefined },
        ],
      }) as Industry;

      let selectedTemplate: string | undefined;
      let style: LogoStyle = "modern";

      if (approach === "template") {
        // Step 3: Professional Template Selection
        console.log(colors.yellow.bold("\n📋 Step 3: Template Selection"));

        // Get templates suitable for the industry
        const generator = new LogoGenerator(configManager.getApiKey());
        const suitableTemplates = generator.getTemplatesForIndustry(
          industry || "general",
        );

        if (suitableTemplates.length > 0) {
          console.log(
            colors.gray(
              `Found ${suitableTemplates.length} templates suitable for ${
                industry || "your business"
              }`,
            ),
          );

          const templateOptions = suitableTemplates.map((template) => ({
            name: `${template.name} - ${template.description}`,
            value: template.id,
          }));

          selectedTemplate = await Select.prompt({
            message: "Choose a professional template:",
            options: [...templateOptions, {
              name: "❌ Skip template, use custom style",
              value: undefined,
            }],
          });
        }

        if (!selectedTemplate) {
          console.log(
            colors.yellow(
              "No template selected, falling back to custom style...",
            ),
          );
        }
      }

      if (!selectedTemplate || approach !== "template") {
        style = await Select.prompt({
          message: "Choose your preferred style:",
          options: [
            { name: "Modern & Clean", value: "modern" },
            { name: "Classic & Traditional", value: "classic" },
            { name: "Minimal & Simple", value: "minimal" },
            { name: "Playful & Creative", value: "playful" },
            { name: "Vintage & Retro", value: "vintage" },
            { name: "Bold & Strong", value: "bold" },
            { name: "Elegant & Sophisticated", value: "elegant" },
            { name: "Tech & Futuristic", value: "tech" },
          ],
        }) as LogoStyle;
      }

      // Step 3/4: Colors
      const stepNumber = selectedTemplate ? 4 : 3;
      console.log(
        colors.yellow.bold(`\n🌈 Step ${stepNumber}: Color Preferences`),
      );

      const useColors = await Confirm.prompt(
        "Do you have specific color preferences?",
      );
      let colorPreferences: string[] | undefined;

      if (useColors) {
        colorPreferences = await Checkbox.prompt({
          message: "Select your preferred colors:",
          options: [
            "Blue",
            "Red",
            "Green",
            "Black",
            "White",
            "Gray",
            "Purple",
            "Orange",
            "Yellow",
            "Pink",
            "Brown",
            "Teal",
          ],
        });
      }

      // Step 4/5: Technical Options
      const techStepNumber = selectedTemplate ? 5 : 4;
      console.log(
        colors.yellow.bold(`\n⚙️ Step ${techStepNumber}: Technical Settings`),
      );

      // Using GPT-image-1 model only
      const model: AIModel = "gpt-image-1";

      const size = await Select.prompt({
        message: "Choose image size:",
        options: [
          {
            name: "Square (1024x1024) - Best for social media",
            value: "1024x1024",
          },
          {
            name: "Portrait (1024x1792) - Good for mobile",
            value: "1024x1792",
          },
          {
            name: "Landscape (1792x1024) - Good for web headers",
            value: "1792x1024",
          },
        ],
      }) as ImageSize;

      const quality = await Select.prompt({
        message: "Select quality level:",
        options: model === "gpt-image-1"
          ? [
            {
              name: "Standard ($0.07 per image) - Web quality",
              value: "standard",
            },
            { name: "HD ($0.19 per image) - Print quality", value: "hd" },
          ]
          : [
            {
              name: "Standard ($0.04 per image) - Good for most uses",
              value: "standard",
            },
            { name: "HD ($0.08 per image) - Higher detail", value: "hd" },
          ],
      }) as ImageQuality;

      const variations = await Number.prompt({
        message: "How many variations would you like?",
        min: 1,
        max: 10,
        default: 3,
      });

      // Final Step: Preview Configuration
      const previewStepNumber = selectedTemplate ? 6 : 5;
      console.log(
        colors.yellow.bold(
          `\n📋 Step ${previewStepNumber}: Review Configuration`,
        ),
      );

      // Calculate actual cost based on model
      const costPerImage = model === "gpt-image-1"
        ? (quality === "hd" ? 0.19 : 0.07)
        : (quality === "hd" ? 0.08 : 0.04);

      const preview = `
${colors.cyan("Company:")} ${company}
${colors.cyan("Description:")} ${description}
${colors.cyan("Approach:")} ${
        approach === "template"
          ? "Professional Template"
          : approach === "custom"
          ? "Custom Style"
          : "Advanced Manual"
      }
${selectedTemplate ? colors.cyan("Template:") + " " + selectedTemplate : ""}
${colors.cyan("Industry:")} ${industry || "Not specified"}
${colors.cyan("Style:")} ${style}
${colors.cyan("Model:")} ${model} ${
        model === "gpt-image-1" ? "(Professional)" : "(Creative)"
      }
${colors.cyan("Colors:")} ${colorPreferences?.join(", ") || "No preference"}
${colors.cyan("Size:")} ${size}
${colors.cyan("Quality:")} ${quality}
${colors.cyan("Variations:")} ${variations}
${colors.cyan("Cost per image:")} $${costPerImage.toFixed(3)}
${colors.cyan("Total estimated cost:")} $${
        (costPerImage * variations).toFixed(3)
      }`;

      console.log(preview.replace(/^\n/, ""));

      const confirm = await Confirm.prompt(
        "Generate logos with these settings?",
      );

      if (!confirm) {
        console.log(colors.yellow("🚫 Generation cancelled"));
        return;
      }

      // Step 6: Generate Logos
      console.log(colors.cyan.bold("\n🎨 Generating your logos..."));

      const generator = new LogoGenerator(configManager.getApiKey());
      const downloader = new ImageDownloader();

      const request: LogoRequest = {
        company,
        prompt: description,
        style,
        industry,
        colors: colorPreferences,
        size,
        quality,
      };

      const generationOptions = {
        style,
        industry,
        colors: colorPreferences,
        size,
        quality,
        model,
        template: selectedTemplate,
      };

      // Generate with progress feedback
      const results = [];
      for (let i = 1; i <= variations; i++) {
        console.log(
          colors.gray(`  Generating variation ${i}/${variations}...`),
        );

        try {
          const result = await generator.generate(request, generationOptions);
          results.push(result);
          console.log(colors.green(`  ✅ Variation ${i} complete`));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.error(
            colors.red(`  ❌ Variation ${i} failed: ${errorMessage}`),
          );
        }
      }

      if (results.length === 0) {
        console.error(colors.red("❌ All generations failed"));
        return;
      }

      console.log(
        colors.green(
          `\n✅ Successfully generated ${results.length}/${variations} logos`,
        ),
      );

      // Step 7: Download
      const outputDir = options.output || config.outputDir || "./logos";
      console.log(colors.yellow(`📥 Downloading to ${outputDir}...`));

      const filepaths = await downloader.downloadBatch(results, outputDir);

      // Step 8: Summary
      console.log(colors.green.bold("\n🎉 Generation Complete!"));
      console.log(`📁 Saved to: ${outputDir}`);

      filepaths.forEach((path, i) => {
        console.log(
          `  ${i + 1}. ${colors.cyan(path.split("/").pop() || path)}`,
        );
      });

      const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
      console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);

      // Show URLs for quick preview
      console.log(colors.gray("\n🔗 Preview URLs (valid for 1 hour):"));
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.url}`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(colors.red(`❌ Wizard failed: ${errorMessage}`));

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
