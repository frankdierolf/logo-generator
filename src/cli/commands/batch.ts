import { Command } from "@cliffy/command";
import { colors } from "@cliffy/ansi/colors";
import pLimit from "p-limit";
import { LogoGenerator } from "../../core/generator.ts";
import { ConfigManager } from "../../infrastructure/config.ts";
import { ImageDownloader } from "../../infrastructure/downloader.ts";
import type {
  BatchRequest,
  BatchResult,
  ImageQuality,
  ImageSize,
  LogoRequest,
  LogoStyle,
} from "../../core/types.ts";

export const batchCommand = new Command()
  .description("Generate multiple logos from a CSV file or JSON array")
  .option("-f, --file <path:string>", "Input file (CSV or JSON)")
  .option("--help-examples", "Show detailed batch file examples")
  .option("-o, --output <dir:string>", "Output directory")
  .option("--concurrency <num:number>", "Number of concurrent generations", {
    default: 3,
  })
  .option("--format <format>", "Input format", { default: "auto" })
  .option(
    "--dry-run",
    "Show what would be generated without actually generating",
  )
  .option("--iteration <num:number>", "Iteration number (creates iteration-N folder)")
  .option("--quiet", "Minimal output for agentic tools")
  .action(async (options) => {
    if (options.helpExamples) {
      showBatchExamples();
      return;
    }

    if (!options.file) {
      console.error("❌ Input file is required. Use --file <path> or --help-examples for examples.");
      Deno.exit(1);
    }

    const configManager = new ConfigManager();
    const config = await configManager.load();

    try {
      if (!options.quiet) {
        console.log(colors.cyan.bold("📦 Batch Logo Generation"));
      }

      // Load and parse input file
      const requests = await loadBatchFile(
        options.file,
        options.format || "auto",
      );
      if (!options.quiet) {
        console.log(colors.gray(`📄 Loaded ${requests.length} logo requests`));
      }

      if (options.dryRun) {
        console.log(
          colors.yellow("🔍 Dry run - showing what would be generated:"),
        );
        requests.forEach((request, i) => {
          console.log(
            `${i + 1}. ${request.company}: "${request.prompt}" (${
              request.style || "modern"
            })`,
          );
        });

        const totalCost = requests.length * 0.04; // Assuming standard quality
        console.log(
          colors.cyan(`\n💰 Estimated cost: $${totalCost.toFixed(3)}`),
        );
        return;
      }

      const generator = new LogoGenerator(configManager.getApiKey());
      const downloader = new ImageDownloader();
      const outputDir = options.output || config.outputDir || "./logos";

      console.log(
        colors.yellow(
          `🚀 Starting batch generation with ${options.concurrency} concurrent workers...`,
        ),
      );

      const batchRequest: BatchRequest = {
        requests,
        concurrency: options.concurrency,
        outputDir,
        iteration: options.iteration,
        quiet: options.quiet,
      };

      const startTime = Date.now();
      const result = await processBatch(generator, downloader, batchRequest);
      const duration = Date.now() - startTime;

      // Display results
      if (options.quiet) {
        // JSON output for agentic tools
        const output = {
          success: true,
          total: result.stats.total,
          successful: result.stats.successful,
          failed: result.stats.failed,
          totalCost: result.stats.totalCost,
          duration: Math.round(duration / 1000),
          outputDir: options.iteration ? `${outputDir}/iteration-${options.iteration}` : outputDir,
          iteration: options.iteration,
          logos: result.successful.map(r => ({
            company: r.metadata.company,
            id: r.metadata.id,
            url: r.url,
            cost: r.metadata.cost,
            localPath: r.localPath,
          })),
          errors: result.failed.map(f => ({
            company: f.request.company,
            error: f.error.message,
          })),
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(colors.green.bold("\n📊 Batch Generation Complete!"));
        console.log(`✅ Successful: ${result.successful.length}`);
        console.log(`❌ Failed: ${result.failed.length}`);
        console.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
        console.log(`💰 Total cost: $${result.stats.totalCost.toFixed(3)}`);
        console.log(`📁 Output directory: ${outputDir}`);

        if (result.failed.length > 0) {
          console.log(colors.red("\n❌ Failed generations:"));
          result.failed.forEach((failure, i) => {
            console.log(
              `  ${i + 1}. ${failure.request.company}: ${failure.error.message}`,
            );
          });
        }
      }

    } catch (error) {
      console.error(
        colors.red(
          `❌ Batch processing failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
      Deno.exit(1);
    }
  });

async function loadBatchFile(
  filepath: string,
  format: string,
): Promise<LogoRequest[]> {
  const content = await Deno.readTextFile(filepath);

  // Auto-detect format
  if (format === "auto") {
    format = filepath.endsWith(".json") ? "json" : "csv";
  }

  if (format === "json") {
    return JSON.parse(content);
  } else {
    return parseCSV(content);
  }
}

function parseCSV(content: string): LogoRequest[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  const requests: LogoRequest[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) =>
      v.trim().replace(/^"|"$/g, "")
    );
    const request: LogoRequest = {
      company: "",
      prompt: "",
    };

    headers.forEach((header, idx) => {
      const value = values[idx];

      switch (header.toLowerCase()) {
        case "company":
          request.company = value;
          break;
        case "prompt":
        case "description":
          request.prompt = value;
          break;
        case "style":
          request.style = value as LogoStyle;
          break;
        case "colors":
          request.colors = value
            ? value.split(";").map((c) => c.trim())
            : undefined;
          break;
        case "size":
          request.size = value as ImageSize;
          break;
        case "quality":
          request.quality = value as ImageQuality;
          break;
      }
    });

    if (request.company && request.prompt) {
      requests.push(request);
    }
  }

  return requests;
}

async function processBatch(
  generator: LogoGenerator,
  downloader: ImageDownloader,
  batch: BatchRequest,
): Promise<BatchResult> {
  const results: BatchResult = {
    successful: [],
    failed: [],
    stats: {
      total: batch.requests.length,
      successful: 0,
      failed: 0,
      totalCost: 0,
      duration: 0,
    },
  };

  const limit = pLimit(batch.concurrency || 3);
  let completed = 0;

  const promises = batch.requests.map((request) =>
    limit(async () => {
      try {
        console.log(
          colors.gray(
            `[${
              completed + 1
            }/${batch.requests.length}] Generating: ${request.company}`,
          ),
        );

        const logoResult = await generator.generate(request, {
          style: request.style,
          colors: request.colors,
          size: request.size,
          quality: request.quality,
        });

        // Download the image
        if (batch.outputDir) {
          logoResult.localPath = await downloader.download(
            logoResult,
            batch.outputDir,
            batch.iteration,
          );
        }

        results.successful.push(logoResult);
        results.stats.successful++;
        results.stats.totalCost += logoResult.metadata.cost;

        completed++;
        if (!batch.quiet) {
          console.log(
            colors.green(
              `✅ ${request.company} complete (${completed}/${batch.requests.length})`,
            ),
          );
        }
      } catch (error) {
        results.failed.push({ request, error: error as Error });
        results.stats.failed++;

        completed++;
        if (!batch.quiet) {
          console.log(
            colors.red(
              `❌ ${request.company} failed (${completed}/${batch.requests.length})`,
            ),
          );
        }
      }
    })
  );

  await Promise.all(promises);

  // Create iteration manifest if iteration is specified
  if (batch.iteration && batch.outputDir && results.successful.length > 0) {
    await downloader.createIterationManifest(
      batch.outputDir,
      batch.iteration,
      `Batch generation: ${batch.requests.length} logos`,
      results.successful,
    );
  }

  return results;
}

function showBatchExamples(): void {
  console.log(colors.cyan.bold("📦 Batch File Examples"));
  
  console.log(colors.yellow.bold("\n🔧 JSON Format (Recommended for Claude Code):"));
  console.log(colors.gray("Create a file like `iteration-1-batch.json`:"));
  
  const jsonExample = `[
  {
    "company": "TechCorp",
    "prompt": "modern software company logo with geometric shapes",
    "style": "modern",
    "colors": ["blue", "gray"],
    "quality": "standard"
  },
  {
    "company": "TechCorp",
    "prompt": "minimalist tech logo with clean typography",
    "style": "minimal",
    "colors": ["blue", "white"],
    "quality": "standard"
  },
  {
    "company": "TechCorp", 
    "prompt": "professional corporate logo with subtle tech elements",
    "style": "corporate",
    "colors": ["blue", "black"],
    "quality": "hd"
  }
]`;

  console.log(colors.dim(jsonExample));

  console.log(colors.yellow.bold("\n📊 CSV Format:"));
  console.log(colors.gray("Create a file like `logos.csv`:"));
  
  const csvExample = `company,prompt,style,colors,quality
TechCorp,modern software logo,modern,"blue;gray",standard
FoodiePlace,cozy restaurant logo,classic,"red;yellow;brown",standard
GreenLeaf,eco-friendly logo with leaf,minimal,"green;white",standard`;

  console.log(colors.dim(csvExample));

  console.log(colors.yellow.bold("\n🚀 Usage Examples:"));
  
  console.log(colors.cyan("Basic batch generation:"));
  console.log(colors.gray("deno run --allow-all jsr:@logocli/logo-generator batch --file batch.json"));
  
  console.log(colors.cyan("\nWith iterations (for Claude Code workflow):"));
  console.log(colors.gray("deno run --allow-all jsr:@logocli/logo-generator batch --file iteration-1.json --iteration 1"));
  
  console.log(colors.cyan("\nQuiet mode for agentic tools:"));
  console.log(colors.gray("deno run --allow-all jsr:@logocli/logo-generator batch --file batch.json --quiet"));
  
  console.log(colors.cyan("\nCustom output directory:"));
  console.log(colors.gray("deno run --allow-all jsr:@logocli/logo-generator batch --file batch.json --output ./my-logos"));

  console.log(colors.yellow.bold("\n🎨 Iterative Design Workflow with Claude Code:"));
  
  const workflowSteps = `1. Create context: deno run --allow-all jsr:@logocli/logo-generator context --company "YourCorp"
2. Initial batch: deno run --allow-all jsr:@logocli/logo-generator batch --file iteration-1.json --iteration 1
3. Review results in ./logos/iteration-1/
4. Create refined iteration-2.json based on results
5. Continue iterating until perfect logo is found
6. Check progress: cat ./logos/iterations.json`;

  console.log(colors.gray(workflowSteps));

  console.log(colors.yellow.bold("\n💡 Pro Tips:"));
  console.log(colors.gray("• Use JSON format for better control and Claude Code compatibility"));
  console.log(colors.gray("• Use iterations to organize design exploration"));
  console.log(colors.gray("• Use --quiet for clean output when working with AI assistants"));
  console.log(colors.gray("• Check iterations.json to track your design journey"));
}
