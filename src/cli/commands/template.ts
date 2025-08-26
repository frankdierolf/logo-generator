import { Command } from "@cliffy/command";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import { LogoGenerator } from "../../core/generator.ts";
import { ConfigManager } from "../../infrastructure/config.ts";
import { ImageDownloader } from "../../infrastructure/downloader.ts";
import type { Industry, LogoRequest, Template } from "../../core/types.ts";

// Command option interfaces
interface TemplateCommandOptions {
  name?: string;
  company?: string;
  template?: string;
  output?: string;
  variations?: boolean | number;
  description?: string;
  prompt?: string;
  industry?: string;
}

export const templateCommand = new Command()
  .description("Manage and use logo templates")
  .command("list", "List available templates")
  .action(listTemplates)
  .command("create", "Create a new template")
  .option("-n, --name <name:string>", "Template name", { required: true })
  .option("-d, --description <desc:string>", "Template description", {
    required: true,
  })
  .option("-p, --prompt <prompt:string>", "Base prompt", { required: true })
  .option("-i, --industry <industry:string>", "Target industry")
  .action(createTemplate)
  .command("use", "Generate logo from template")
  .option("-t, --template <name:string>", "Template name", { required: true })
  .option("-c, --company <company:string>", "Company name", { required: true })
  .option("-v, --variations", "Generate all template variations")
  .option("-o, --output <dir:string>", "Output directory")
  .action(useTemplate)
  .command("show", "Show template details")
  .option("-t, --template <name:string>", "Template name", { required: true })
  .action(showTemplate);

async function listTemplates() {
  const templatesDir = getTemplatesDir();

  try {
    const templates = await loadAllTemplates(templatesDir);

    if (templates.length === 0) {
      console.log(colors.yellow("📝 No templates found"));
      console.log(colors.gray("Create one with: logo-cli template create"));
      return;
    }

    console.log(colors.cyan.bold("📋 Available Templates:"));

    templates.forEach((template, i) => {
      console.log(`\n${i + 1}. ${colors.bold(template.name)}`);
      console.log(`   ${colors.gray(template.description)}`);
      console.log(`   Industry: ${template.industry || "Any"}`);
      console.log(`   Variations: ${template.variations.length}`);
      console.log(
        `   Created: ${
          new Date(template.metadata.created).toLocaleDateString()
        }`,
      );
    });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error instanceof Error ? error.message : String(error)
      : String(error);
    console.error(colors.red(`❌ Failed to list templates: ${errorMessage}`));
  }
}

async function createTemplate(options: TemplateCommandOptions) {
  const templatesDir = getTemplatesDir();
  await ensureDir(templatesDir);

  console.log(colors.cyan.bold("📝 Creating New Template"));

  try {
    // Get additional details interactively if not provided
    const industry = options.industry || await Select.prompt({
      message: "Target industry (optional):",
      options: [
        { name: "Any", value: undefined },
        { name: "Technology", value: "technology" },
        { name: "Healthcare", value: "healthcare" },
        { name: "Finance", value: "finance" },
        { name: "Retail", value: "retail" },
        { name: "Education", value: "education" },
        { name: "Food & Beverage", value: "food" },
      ],
    });

    // Create template variations
    console.log(colors.yellow("\n🔄 Define Template Variations"));
    console.log(
      colors.gray(
        "Templates can have multiple variations (e.g., icon, wordmark, full logo)",
      ),
    );

    const variations = [];
    let addMore = true;

    while (addMore && variations.length < 5) {
      const variationName = await Input.prompt({
        message: `Variation ${variations.length + 1} name:`,
        default: variations.length === 0 ? "primary" : "",
      });

      const modifier = await Input.prompt({
        message: "Variation modifier (added to base prompt):",
        hint: "e.g., 'icon only', 'text-based', 'horizontal layout'",
      });

      const description = await Input.prompt({
        message: "Variation description:",
        hint: "Brief explanation of this variation",
      });

      variations.push({ name: variationName, modifier, description });

      if (variations.length < 5) {
        addMore = await Confirm.prompt("Add another variation?");
      }
    }

    // Validate required fields
    if (!options.name) {
      throw new Error("Template name is required");
    }
    if (!options.description) {
      throw new Error("Template description is required");
    }
    if (!options.prompt) {
      throw new Error("Template prompt is required");
    }

    // Create template object
    const template: Template = {
      id: generateTemplateId(options.name),
      name: options.name,
      description: options.description,
      basePrompt: options.prompt,
      industry: industry as Industry,
      variations,
      metadata: {
        author: Deno.env.get("USER") || "unknown",
        version: "1.0.0",
        tags: [],
        created: Date.now(),
        updated: Date.now(),
      },
    };

    // Save template
    const templatePath = join(templatesDir, `${template.id}.json`);
    await Deno.writeTextFile(templatePath, JSON.stringify(template, null, 2));

    console.log(
      colors.green(`✅ Template '${template.name}' created successfully`),
    );
    console.log(colors.gray(`📁 Saved to: ${templatePath}`));
  } catch (error) {
    console.error(
      colors.red(
        `❌ Failed to create template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}

async function useTemplate(options: TemplateCommandOptions) {
  const templatesDir = getTemplatesDir();

  try {
    if (!options.template) {
      throw new Error("Template name is required");
    }
    if (!options.company) {
      throw new Error("Company name is required");
    }
    const template = await loadTemplate(templatesDir, options.template);

    console.log(colors.cyan.bold(`🎨 Using Template: ${template.name}`));
    console.log(colors.gray(template.description));

    const configManager = new ConfigManager();
    const config = await configManager.load();
    const generator = new LogoGenerator(configManager.getApiKey());
    const downloader = new ImageDownloader();

    // Determine which variations to generate
    const variationsToGenerate = options.variations
      ? template.variations
      : [template.variations[0]];

    console.log(
      colors.yellow(
        `Generating ${variationsToGenerate.length} variation(s)...`,
      ),
    );

    const results = [];

    for (const variation of variationsToGenerate) {
      console.log(colors.gray(`  Generating ${variation.name}...`));

      const prompt = `${template.basePrompt}, ${variation.modifier}`;

      const request: LogoRequest = {
        company: options.company,
        prompt,
        industry: template.industry,
      };

      try {
        const result = await generator.generate(request);
        results.push({ variation: variation.name, result });
        console.log(colors.green(`  ✅ ${variation.name} complete`));
      } catch (error) {
        console.error(
          colors.red(
            `  ❌ ${variation.name} failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
        );
      }
    }

    if (results.length === 0) {
      console.error(colors.red("❌ All generations failed"));
      return;
    }

    // Download results
    const outputDir = options.output || config.outputDir || "./logos";
    console.log(colors.yellow(`📥 Downloading to ${outputDir}...`));

    const filepaths = [];
    for (const { variation, result } of results) {
      try {
        const filepath = await downloader.download(
          result,
          join(outputDir, template.name),
        );
        filepaths.push({ variation, filepath });
      } catch (error) {
        console.error(
          colors.red(
            `Failed to download ${variation}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
        );
      }
    }

    console.log(colors.green.bold("\n✅ Template Generation Complete!"));
    console.log(`📁 Template: ${template.name}`);
    console.log(`🏢 Company: ${options.company}`);

    filepaths.forEach(({ variation, filepath }) => {
      console.log(
        `  ${variation}: ${colors.cyan(filepath.split("/").pop() || filepath)}`,
      );
    });

    const totalCost = results.reduce(
      (sum, { result }) => sum + result.metadata.cost,
      0,
    );
    console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);
  } catch (error) {
    console.error(
      colors.red(
        `❌ Template generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}

async function showTemplate(options: TemplateCommandOptions) {
  const templatesDir = getTemplatesDir();

  try {
    if (!options.template) {
      throw new Error("Template name is required");
    }
    const template = await loadTemplate(templatesDir, options.template);

    console.log(colors.cyan.bold(`📄 Template: ${template.name}`));
    console.log(`${colors.bold("Description:")} ${template.description}`);
    console.log(`${colors.bold("Industry:")} ${template.industry || "Any"}`);
    console.log(`${colors.bold("Base Prompt:")} ${template.basePrompt}`);
    console.log(`${colors.bold("Author:")} ${template.metadata.author}`);
    console.log(`${colors.bold("Version:")} ${template.metadata.version}`);
    console.log(
      `${colors.bold("Created:")} ${
        new Date(template.metadata.created).toLocaleDateString()
      }`,
    );

    console.log(colors.yellow.bold("\n🔄 Variations:"));
    template.variations.forEach((variation, i) => {
      console.log(`${i + 1}. ${colors.bold(variation.name)}`);
      console.log(`   Modifier: ${variation.modifier}`);
      console.log(`   Description: ${variation.description}`);
    });
  } catch (error) {
    console.error(
      colors.red(
        `❌ Failed to show template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}

// Utility functions
function getTemplatesDir(): string {
  return join(Deno.cwd(), "templates");
}

function generateTemplateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadTemplate(
  templatesDir: string,
  nameOrId: string,
): Promise<Template> {
  // Try loading by ID first
  let templatePath = join(templatesDir, `${nameOrId}.json`);

  if (!await exists(templatePath)) {
    // Try loading by name (convert to ID format)
    const id = generateTemplateId(nameOrId);
    templatePath = join(templatesDir, `${id}.json`);
  }

  if (!await exists(templatePath)) {
    throw new Error(`Template '${nameOrId}' not found`);
  }

  const content = await Deno.readTextFile(templatePath);
  return JSON.parse(content);
}

async function loadAllTemplates(templatesDir: string): Promise<Template[]> {
  const templates: Template[] = [];

  if (!await exists(templatesDir)) {
    return templates;
  }

  for await (const dirEntry of Deno.readDir(templatesDir)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".json")) {
      try {
        const content = await Deno.readTextFile(
          join(templatesDir, dirEntry.name),
        );
        const template = JSON.parse(content);
        templates.push(template);
      } catch (error) {
        console.warn(
          `Warning: Failed to load template ${dirEntry.name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}
