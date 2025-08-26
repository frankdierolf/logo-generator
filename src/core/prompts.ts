import type {
  GenerationOptions,
  Industry,
  LogoRequest,
  LogoStyle,
} from "./types.ts";

interface PromptTemplate {
  base: string;
  modifiers: string[];
  negative: string[];
  styleElements: string[];
}

export class PromptEngine {
  private templates = new Map<Industry, PromptTemplate>();
  private styleModifiers = new Map<LogoStyle, string>();

  constructor() {
    this.initializeTemplates();
    this.initializeStyleModifiers();
  }

  optimize(request: LogoRequest, options: GenerationOptions): string {
    const style = options.style || request.style || "modern";
    const industry = options.industry || request.industry;

    let optimizedPrompt = this.buildBasePrompt(request, style, industry);
    optimizedPrompt = this.addStyleElements(optimizedPrompt, style);
    optimizedPrompt = this.addColorGuidance(
      optimizedPrompt,
      options.colors || request.colors,
    );
    optimizedPrompt = this.addQualityModifiers(optimizedPrompt);

    return optimizedPrompt;
  }

  private buildBasePrompt(
    request: LogoRequest,
    style: LogoStyle,
    industry?: Industry,
  ): string {
    const template = industry ? this.templates.get(industry) : null;
    const baseDescription = template?.base || "professional logo";

    return `${style} ${baseDescription} for ${request.company}: ${request.prompt}`;
  }

  private addStyleElements(prompt: string, style: LogoStyle): string {
    const styleElements = this.styleModifiers.get(style) || "";
    return `${prompt}, ${styleElements}`;
  }

  private addColorGuidance(prompt: string, colors?: string[]): string {
    if (!colors || colors.length === 0) {
      return prompt;
    }

    const colorGuidance = colors.length === 1
      ? `primarily ${colors[0]} color scheme`
      : `using ${colors.slice(0, -1).join(", ")} and ${
        colors[colors.length - 1]
      } colors`;

    return `${prompt}, ${colorGuidance}`;
  }

  private addQualityModifiers(prompt: string): string {
    const qualityModifiers = [
      "clean geometric shapes",
      "scalable vector design",
      "professional quality",
      "suitable for branding",
      "on white background",
      "high contrast",
      "memorable and distinctive",
    ];

    return `${prompt}, ${qualityModifiers.join(", ")}`;
  }

  private initializeTemplates() {
    this.templates.set("technology", {
      base: "minimalist tech logo with geometric elements",
      modifiers: ["circuit patterns", "digital aesthetic", "innovation theme"],
      negative: ["no photorealistic details", "no complex shading"],
      styleElements: ["clean lines", "modern typography", "tech symbols"],
    });

    this.templates.set("healthcare", {
      base: "medical logo with caring symbolism",
      modifiers: ["calming presence", "trustworthy design", "health-focused"],
      negative: ["no aggressive imagery", "no dark themes"],
      styleElements: ["medical cross", "heart symbol", "caring hands"],
    });

    this.templates.set("finance", {
      base: "financial services logo conveying trust",
      modifiers: ["stability", "growth", "security"],
      negative: ["no playful elements", "no informal styling"],
      styleElements: [
        "upward arrows",
        "shield symbols",
        "professional typography",
      ],
    });

    this.templates.set("retail", {
      base: "retail brand logo appealing to customers",
      modifiers: ["approachable", "shopping-focused", "brand recognition"],
      negative: ["no corporate coldness", "no complexity"],
      styleElements: [
        "shopping symbols",
        "friendly typography",
        "retail colors",
      ],
    });

    this.templates.set("food", {
      base: "food and beverage logo with appetite appeal",
      modifiers: ["appetizing", "fresh", "quality ingredients"],
      negative: ["no industrial look", "no cold colors"],
      styleElements: ["food symbols", "warm colors", "inviting design"],
    });

    this.templates.set("education", {
      base: "educational logo promoting learning",
      modifiers: ["knowledge", "growth", "academic excellence"],
      negative: ["no childish elements", "no outdated symbols"],
      styleElements: ["book symbols", "graduation caps", "learning icons"],
    });
  }

  private initializeStyleModifiers() {
    this.styleModifiers.set(
      "modern",
      "contemporary design, sleek lines, current trends",
    );
    this.styleModifiers.set(
      "vintage",
      "retro aesthetic, classic elements, nostalgic feel",
    );
    this.styleModifiers.set(
      "minimal",
      "simple clean design, essential elements only, whitespace",
    );
    this.styleModifiers.set(
      "playful",
      "vibrant colors, dynamic composition, fun elements",
    );
    this.styleModifiers.set(
      "classic",
      "timeless design, traditional elements, elegant",
    );
    this.styleModifiers.set(
      "bold",
      "strong visual impact, dramatic elements, confident",
    );
    this.styleModifiers.set(
      "elegant",
      "refined aesthetics, sophisticated, premium feel",
    );
    this.styleModifiers.set(
      "tech",
      "futuristic elements, digital theme, innovation",
    );
  }

  createBrandConsistentPrompt(
    basePrompt: string,
    brandKeywords: string[],
  ): string {
    const consistency = brandKeywords.join(", ");
    return `${basePrompt}, maintaining brand consistency with ${consistency}`;
  }

  createVariationPrompt(basePrompt: string, variationType: string): string {
    const variations = {
      "icon": "simplified icon version, symbol only",
      "wordmark": "text-only version, typography focus",
      "combination": "combined symbol and text version",
      "horizontal": "horizontal layout orientation",
      "vertical": "vertical layout orientation",
      "monochrome": "single color version, black and white",
    };

    const modifier = variations[variationType as keyof typeof variations] ||
      variationType;
    return `${basePrompt}, ${modifier}`;
  }
}
