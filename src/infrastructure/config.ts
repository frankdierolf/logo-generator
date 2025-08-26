import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";
import type { ConfigOptions } from "../core/types.ts";

export class ConfigManager {
  private configPath: string;
  private config: ConfigOptions = {};

  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
  }

  async load(): Promise<ConfigOptions> {
    try {
      if (await exists(this.configPath)) {
        const content = await Deno.readTextFile(this.configPath);
        this.config = JSON.parse(content);
      } else {
        // Create default config if it doesn't exist
        await this.createDefaultConfig();
      }
    } catch (error) {
      console.warn(
        `Warning: Could not load config from ${this.configPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.config = this.getDefaultConfig();
    }

    // Override with environment variables
    this.overrideWithEnv();

    return this.config;
  }

  async save(config: ConfigOptions): Promise<void> {
    this.config = { ...this.config, ...config };

    // Ensure config directory exists
    const configDir = this.configPath.split("/").slice(0, -1).join("/");
    await ensureDir(configDir);

    await Deno.writeTextFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
    );
  }

  get(): ConfigOptions {
    return this.config;
  }

  getApiKey(): string {
    const apiKey = this.config.apiKey || Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error(
        "OpenAI API key not found. Set OPENAI_API_KEY environment variable or run 'logo-cli config --api-key YOUR_KEY'",
      );
    }

    return apiKey;
  }

  private getDefaultConfigPath(): string {
    const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
    return join(home, ".config", "logo-cli", "config.json");
  }

  private getDefaultConfig(): ConfigOptions {
    return {
      defaultStyle: "modern",
      defaultQuality: "standard",
      defaultSize: "1024x1024",
      outputDir: "./logos",
      cacheEnabled: true,
      cacheTtl: 3600, // 1 hour
      maxCacheSize: "500MB",
    };
  }

  private async createDefaultConfig(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.save(this.config);
  }

  private overrideWithEnv(): void {
    const envApiKey = Deno.env.get("OPENAI_API_KEY");
    if (envApiKey) {
      this.config.apiKey = envApiKey;
    }

    const envOutputDir = Deno.env.get("LOGO_OUTPUT_DIR");
    if (envOutputDir) {
      this.config.outputDir = envOutputDir;
    }

    const envCacheEnabled = Deno.env.get("LOGO_CACHE_ENABLED");
    if (envCacheEnabled) {
      this.config.cacheEnabled = envCacheEnabled.toLowerCase() === "true";
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    await this.save({ apiKey });
    console.log("✅ API key saved to config");
  }

  async setOutputDir(outputDir: string): Promise<void> {
    await this.save({ outputDir });
    console.log(`✅ Output directory set to: ${outputDir}`);
  }

  async toggleCache(): Promise<void> {
    const enabled = !this.config.cacheEnabled;
    await this.save({ cacheEnabled: enabled });
    console.log(`✅ Cache ${enabled ? "enabled" : "disabled"}`);
  }

  printConfig(): void {
    console.log("📋 Current Configuration:");
    console.log(`  API Key: ${this.config.apiKey ? "✅ Set" : "❌ Not set"}`);
    console.log(`  Default Style: ${this.config.defaultStyle}`);
    console.log(`  Default Quality: ${this.config.defaultQuality}`);
    console.log(`  Default Size: ${this.config.defaultSize}`);
    console.log(`  Output Directory: ${this.config.outputDir}`);
    console.log(`  Cache Enabled: ${this.config.cacheEnabled ? "✅" : "❌"}`);
    console.log(`  Cache TTL: ${this.config.cacheTtl}s`);
    console.log(`  Max Cache Size: ${this.config.maxCacheSize}`);
  }
}
