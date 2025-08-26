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
  .option("-f, --file <path:string>", "Input file (CSV or JSON)", {
    required: true,
  })
  .option("-o, --output <dir:string>", "Output directory")
  .option("--concurrency <num:number>", "Number of concurrent generations", {
    default: 3,
  })
  .option("--format <format>", "Input format", { default: "auto" })
  .option(
    "--dry-run",
    "Show what would be generated without actually generating",
  )
  .action(async (options) => {
    const configManager = new ConfigManager();
    const config = await configManager.load();

    try {
      console.log(colors.cyan.bold("📦 Batch Logo Generation"));

      // Load and parse input file
      const requests = await loadBatchFile(
        options.file,
        options.format || "auto",
      );
      console.log(colors.gray(`📄 Loaded ${requests.length} logo requests`));

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
      };

      const startTime = Date.now();
      const result = await processBatch(generator, downloader, batchRequest);
      const duration = Date.now() - startTime;

      // Display results
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

      // Show cache statistics if available
      if (result.stats.cacheHits > 0) {
        const cacheRate = (result.stats.cacheHits / result.stats.total * 100)
          .toFixed(1);
        console.log(
          colors.cyan(
            `🗄️ Cache hits: ${result.stats.cacheHits} (${cacheRate}%)`,
          ),
        );
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
      cacheHits: 0,
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
          );
        }

        results.successful.push(logoResult);
        results.stats.successful++;
        results.stats.totalCost += logoResult.metadata.cost;

        completed++;
        console.log(
          colors.green(
            `✅ ${request.company} complete (${completed}/${batch.requests.length})`,
          ),
        );
      } catch (error) {
        results.failed.push({ request, error: error as Error });
        results.stats.failed++;

        completed++;
        console.log(
          colors.red(
            `❌ ${request.company} failed (${completed}/${batch.requests.length})`,
          ),
        );
      }
    })
  );

  await Promise.all(promises);

  return results;
}
