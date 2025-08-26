import OpenAI from "openai";
import type {
  AIModel,
  GenerationOptions,
  Industry,
  LogoMetadata,
  LogoRequest,
  LogoResult,
} from "./types.ts";
import { PromptEngine } from "./prompts.ts";
import { ProfessionalPromptEngine } from "./professional-prompts.ts";
import { RetryStrategy } from "../utils/retry.ts";
import { generateId } from "../utils/id.ts";

export class LogoGenerator {
  private client: OpenAI;
  private promptEngine: PromptEngine;
  private professionalPromptEngine: ProfessionalPromptEngine;
  private retryStrategy: RetryStrategy;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new OpenAI({ apiKey });
    this.promptEngine = new PromptEngine();
    this.professionalPromptEngine = new ProfessionalPromptEngine();
    this.retryStrategy = new RetryStrategy();
  }

  async generate(
    request: LogoRequest,
    options: GenerationOptions = {},
  ): Promise<LogoResult> {
    // Use professional prompt engine for better results
    const optimizedPrompt = options.template
      ? this.professionalPromptEngine.optimizePrompt(request, options)
      : this.promptEngine.optimize(request, options);

    const result = await this.retryStrategy.execute(async () => {
      const model = "gpt-image-1";
      const apiParams = this.buildAPIParams(model, optimizedPrompt, options);

      const response = await this.client.images.generate(apiParams);

      // Type guard to ensure we have a response with data (not a stream)
      if (!("data" in response) || !response.data || !response.data[0]) {
        throw new Error("No image generated from OpenAI");
      }

      const imageData = response.data[0];
      
      if (!imageData.url) {
        throw new Error("No URL returned from OpenAI API. Please try again.");
      }
      
      const imageUrl = imageData.url;

      return {
        url: imageUrl,
        revisedPrompt: imageData.revised_prompt,
        metadata: this.createMetadata(
          request,
          optimizedPrompt,
          response,
          options,
        ),
      };
    });

    return result;
  }

  async generateVariations(
    request: LogoRequest,
    count: number = 3,
    options: GenerationOptions = {},
  ): Promise<LogoResult[]> {
    const results: LogoResult[] = [];

    // Generate base logo first
    const baseResult = await this.generate(request, options);
    results.push(baseResult);

    // Generate variations based on the revised prompt
    const basePrompt = baseResult.revisedPrompt || request.prompt;

    for (let i = 1; i < count; i++) {
      const variationRequest: LogoRequest = {
        ...request,
        prompt: this.createVariationPrompt(basePrompt, i),
      };

      const variation = await this.generate(variationRequest, options);
      results.push(variation);
    }

    return results;
  }

  private createVariationPrompt(basePrompt: string, index: number): string {
    const modifiers = [
      "with alternative composition",
      "using different color scheme",
      "with varied typography treatment",
      "featuring adjusted element positioning",
      "in alternative style approach",
    ];

    const modifier = modifiers[index % modifiers.length];
    return `${basePrompt}, ${modifier}`;
  }

  private createMetadata(
    request: LogoRequest,
    finalPrompt: string,
    _response: { data?: unknown[] },
    options: GenerationOptions,
  ): LogoMetadata {
    return {
      id: generateId(),
      timestamp: Date.now(),
      company: request.company,
      originalPrompt: request.prompt,
      finalPrompt,
      style: options.style || request.style || "modern",
      industry: options.industry || request.industry,
      size: options.size || request.size || "1024x1024",
      quality: options.quality || request.quality || "standard",
      cost: this.calculateCost(
        options.quality || "standard",
      ),
    };
  }

  private calculateCost(
    quality: "standard" | "hd",
  ): number {
    // GPT-image-1 pricing by quality tier
    const qualityMap = {
      "standard": 0.07, // Medium quality
      "hd": 0.19, // High quality
    };
    return qualityMap[quality] || 0.07;
  }

  /**
   * Build API parameters for GPT-image-1
   */
  private buildAPIParams(
    _model: AIModel,
    prompt: string,
    options: GenerationOptions,
  ): OpenAI.Images.ImageGenerateParams {
    // Map quality values for GPT-image-1
    const qualityMap: Record<string, "medium" | "high"> = {
      "standard": "medium",
      "hd": "high",
    };
    const quality = qualityMap[options.quality || "standard"] || "medium";

    return {
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: options.size || "1024x1024",
      quality,
      background: "transparent", // Native transparency support in GPT-image-1
      response_format: "url", // Force URL response instead of base64
      stream: false, // Ensure we get a response object, not a stream
    };
  }

  /**
   * Get professional templates by category
   */
  getTemplatesByCategory(
    category: "minimal" | "corporate" | "creative" | "industry-specific",
  ) {
    return this.professionalPromptEngine.getTemplatesByCategory(category);
  }

  /**
   * Get templates suitable for industry
   */
  getTemplatesForIndustry(industry: string) {
    return this.professionalPromptEngine.getTemplatesForIndustry(
      industry as Industry,
    );
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
