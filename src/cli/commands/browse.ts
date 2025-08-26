import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import { ProfessionalPromptEngine } from "../../core/professional-prompts.ts";
import type {
  Industry,
  ProfessionalTemplate,
  TemplateCategory,
} from "../../core/types.ts";

export const browseCommand = new Command()
  .description("Browse and preview professional logo templates")
  .option(
    "-c, --category <category>",
    "Filter by category (minimal, corporate, creative, industry-specific)",
  )
  .option(
    "-i, --industry <industry>",
    "Filter by industry (technology, healthcare, finance, food, education, real-estate, automotive, creative, consulting, legal)",
  )
  .option(
    "--complexity <level>",
    "Filter by complexity (basic, intermediate, advanced)",
  )
  .option("--list", "Show simple list format")
  .action((options) => {
    console.log(colors.cyan.bold("🎨 Professional Logo Templates"));

    try {
      const promptEngine = new ProfessionalPromptEngine();
      let templates;

      // Filter templates based on options
      if (options.category) {
        templates = promptEngine.getTemplatesByCategory(
          options.category as TemplateCategory,
        );
        console.log(
          colors.yellow(
            `\n📂 ${
              options.category.charAt(0).toUpperCase() +
              options.category.slice(1)
            } Templates:`,
          ),
        );
      } else if (options.industry) {
        templates = promptEngine.getTemplatesForIndustry(
          options.industry as Industry,
        );
        console.log(
          colors.yellow(
            `\n🏢 ${
              options.industry.charAt(0).toUpperCase() +
              options.industry.slice(1)
            } Templates:`,
          ),
        );
      } else {
        // Show all templates organized by category
        showAllTemplates(promptEngine);
        return;
      }

      // Apply complexity filter
      if (options.complexity) {
        templates = templates.filter((t) =>
          t.complexity === options.complexity
        );
      }

      if (templates.length === 0) {
        console.log(colors.red("No templates found matching your criteria"));
        return;
      }

      // Display templates
      if (options.list) {
        showSimpleList(templates);
      } else {
        showDetailedTemplates(templates);
      }
    } catch (error) {
      console.error(
        colors.red(
          `❌ Failed to browse templates: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  });

function showAllTemplates(promptEngine: ProfessionalPromptEngine) {
  const categories = [
    "minimal",
    "corporate",
    "creative",
    "industry-specific",
  ] as const;

  for (const category of categories) {
    const templates = promptEngine.getTemplatesByCategory(category);

    console.log(
      colors.yellow.bold(
        `\n📂 ${
          category.charAt(0).toUpperCase() + category.slice(1)
        } (${templates.length} templates)`,
      ),
    );

    templates.forEach((template, i) => {
      const complexity = getComplexityIcon(template.complexity);
      const industryFit = template.industryFit.length > 0
        ? ` | ${template.industryFit.slice(0, 2).join(", ")}${
          template.industryFit.length > 2 ? "..." : ""
        }`
        : "";

      console.log(`  ${i + 1}. ${colors.cyan(template.name)} ${complexity}`);
      console.log(
        `     ${colors.gray(template.description)}${colors.dim(industryFit)}`,
      );
      console.log(`     ${colors.dim(`ID: ${template.id}`)}`);
    });
  }

  console.log(
    colors.green(`\n✨ Total: ${
      categories.reduce(
        (sum, cat) => sum + promptEngine.getTemplatesByCategory(cat).length,
        0,
      )
    } professional templates`),
  );
  console.log(
    colors.gray(
      "\n💡 Use specific templates with: logo-cli generate -t <template-id>",
    ),
  );
  console.log(colors.gray("💡 Filter by category: logo-cli browse -c minimal"));
  console.log(
    colors.gray("💡 Filter by industry: logo-cli browse -i technology"),
  );
}

function showSimpleList(templates: ProfessionalTemplate[]) {
  templates.forEach((template, i) => {
    console.log(`${i + 1}. ${template.id} - ${template.name}`);
  });
}

function showDetailedTemplates(templates: ProfessionalTemplate[]) {
  for (const template of templates) {
    console.log(
      `\n${colors.bold.cyan(template.name)} ${
        getComplexityIcon(template.complexity)
      }`,
    );
    console.log(`  ${colors.gray("ID:")} ${template.id}`);
    console.log(`  ${colors.gray("Description:")} ${template.description}`);
    console.log(`  ${colors.gray("Category:")} ${template.category}`);
    console.log(`  ${colors.gray("Complexity:")} ${template.complexity}`);

    if (template.industryFit.length > 0) {
      console.log(
        `  ${colors.gray("Best for:")} ${template.industryFit.join(", ")}`,
      );
    }

    if (template.examples.length > 0) {
      console.log(
        `  ${colors.gray("Examples:")} ${template.examples.join(", ")}`,
      );
    }

    console.log(`  ${colors.gray("Cost tier:")} ${template.costTier} quality`);
    console.log(
      `  ${colors.dim("Base prompt:")} ${colors.dim(template.basePrompt)}`,
    );
  }

  console.log(
    colors.green(`\n✨ Found ${templates.length} matching templates`),
  );
}

function getComplexityIcon(complexity: string): string {
  switch (complexity) {
    case "basic":
      return colors.green("●");
    case "intermediate":
      return colors.yellow("●●");
    case "advanced":
      return colors.red("●●●");
    default:
      return "";
  }
}
