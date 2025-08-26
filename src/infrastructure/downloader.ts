import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import type { LogoMetadata, LogoResult } from "../core/types.ts";

export class ImageDownloader {
  async download(result: LogoResult, outputDir: string, iteration?: number): Promise<string> {
    const finalOutputDir = iteration ? join(outputDir, `iteration-${iteration}`) : outputDir;
    await ensureDir(finalOutputDir);

    const filename = this.generateFilename(result.metadata);
    const filepath = join(finalOutputDir, filename);

    try {
      const response = await fetch(result.url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      await Deno.writeFile(filepath, new Uint8Array(imageBuffer));

      // Save metadata alongside the image
      await this.saveMetadata(result.metadata, finalOutputDir);

      return filepath;
    } catch (error) {
      throw new Error(
        `Failed to download image: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async downloadBatch(
    results: LogoResult[],
    outputDir: string,
    iteration?: number,
  ): Promise<string[]> {
    const filepaths: string[] = [];

    for (const result of results) {
      try {
        const filepath = await this.download(result, outputDir, iteration);
        filepaths.push(filepath);
      } catch (error) {
        console.error(
          `Failed to download ${result.metadata.company}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return filepaths;
  }

  private generateFilename(metadata: LogoMetadata): string {
    const sanitizedCompany = metadata.company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const timestamp = new Date(metadata.timestamp).toISOString().slice(0, 10);
    const style = metadata.style;

    return `${sanitizedCompany}-${style}-${timestamp}-${
      metadata.id.slice(-6)
    }.png`;
  }

  private async saveMetadata(
    metadata: LogoMetadata,
    outputDir: string,
  ): Promise<void> {
    const metadataFilename = `${metadata.id}.json`;
    const metadataPath = join(outputDir, ".metadata", metadataFilename);

    await ensureDir(join(outputDir, ".metadata"));
    await Deno.writeTextFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async loadMetadata(
    logoId: string,
    outputDir: string,
  ): Promise<LogoMetadata | null> {
    try {
      const metadataPath = join(outputDir, ".metadata", `${logoId}.json`);
      const content = await Deno.readTextFile(metadataPath);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async createIterationManifest(
    outputDir: string,
    iteration: number,
    description: string,
    results: LogoResult[],
  ): Promise<void> {
    const manifestPath = join(outputDir, "iterations.json");
    
    let manifest: any = {};
    try {
      const content = await Deno.readTextFile(manifestPath);
      manifest = JSON.parse(content);
    } catch {
      manifest = { iterations: [] };
    }

    const iterationData = {
      iteration,
      timestamp: Date.now(),
      description,
      count: results.length,
      totalCost: results.reduce((sum, r) => sum + r.metadata.cost, 0),
      logos: results.map(r => ({
        company: r.metadata.company,
        id: r.metadata.id,
        style: r.metadata.style,
        cost: r.metadata.cost,
      })),
    };

    manifest.iterations = manifest.iterations || [];
    manifest.iterations.push(iterationData);

    await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
  }
}
