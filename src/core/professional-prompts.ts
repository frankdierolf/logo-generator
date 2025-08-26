import type {
  GenerationOptions,
  Industry,
  LogoRequest,
  LogoStyle,
  LogoTemplate,
  ProfessionalTemplate,
  TemplateCategory,
} from "./types.ts";

/**
 * Professional prompt engineering system based on GPT-image-1 research
 * Follows the proven pattern: [Style] [Type] logo of [Subject], [Technical Requirements], [Background] --[Modifiers]
 */
export class ProfessionalPromptEngine {
  private templates = new Map<LogoTemplate, ProfessionalTemplate>();

  constructor() {
    this.initializeProfessionalTemplates();
  }

  /**
   * Generate optimized prompt using professional patterns
   */
  optimizePrompt(request: LogoRequest, options: GenerationOptions): string {
    // Use template if specified
    if (options.template) {
      return this.generateFromTemplate(request, options);
    }

    // Generate using structured approach
    return this.generateStructuredPrompt(request, options);
  }

  /**
   * Generate prompt from professional template
   */
  private generateFromTemplate(
    request: LogoRequest,
    options: GenerationOptions,
  ): string {
    const template = this.templates.get(options.template as LogoTemplate);
    if (!template) {
      throw new Error(`Template not found: ${options.template}`);
    }

    let prompt = template.basePrompt;

    // Replace template variables
    prompt = this.interpolateTemplate(prompt, request, options);

    // Add technical requirements
    prompt += this.getTechnicalRequirements(options);

    // Add negative prompts
    const negatives = [...template.negativePrompts];
    if (options.negativePrompts) {
      negatives.push(...options.negativePrompts);
    }

    if (negatives.length > 0) {
      prompt += ` --${negatives.join(" --")}`;
    }

    return prompt;
  }

  /**
   * Generate using structured prompt pattern
   */
  private generateStructuredPrompt(
    request: LogoRequest,
    options: GenerationOptions,
  ): string {
    const parts = [];

    // [Style] - Professional style keywords
    parts.push(
      this.getStyleKeywords(options.style || request.style || "modern"),
    );

    // [Type] - Logo type specification
    parts.push("logo of");

    // [Subject] - Company and description
    parts.push(`${request.company}, ${request.prompt}`);

    // [Technical Requirements]
    parts.push(this.getTechnicalRequirements(options));

    // [Background]
    parts.push("on white background");

    let prompt = parts.join(" ");

    // [Modifiers] - Negative prompts for quality control
    const negatives = this.getDefaultNegatives();
    if (options.negativePrompts) {
      negatives.push(...options.negativePrompts);
    }

    prompt += ` --${negatives.join(" --")}`;

    return prompt.trim();
  }

  /**
   * Get professional style keywords based on research
   */
  private getStyleKeywords(style: LogoStyle): string {
    const styleMap: Record<LogoStyle, string> = {
      "modern": "Contemporary minimalist",
      "minimal": "Clean minimal geometric",
      "geometric": "Simple geometric flat",
      "abstract": "Abstract artistic",
      "corporate": "Professional corporate",
      "tech": "Modern tech sleek",
      "elegant": "Sophisticated elegant",
      "bold": "Strong bold impactful",
      "vintage": "Classic vintage retro",
      "playful": "Creative playful dynamic",
      "classic": "Traditional classic timeless",
      "wordmark": "Typography-focused wordmark",
      "lettermark": "Letter-based minimal",
      "pictorial": "Symbolic pictorial",
      "emblem": "Badge emblem",
      "combination": "Combined symbol-text",
    };

    return styleMap[style] || "Professional";
  }

  /**
   * Get technical requirements for professional logos
   */
  private getTechnicalRequirements(options: GenerationOptions): string {
    const requirements = [
      "flat vector design",
      "scalable",
      "professional quality",
      "high contrast",
    ];

    // Add color requirements
    if (options.colors && options.colors.length > 0) {
      const colorDesc = options.colors.length === 1
        ? `${options.colors[0]} color scheme`
        : `using ${options.colors.slice(0, -1).join(", ")} and ${
          options.colors[options.colors.length - 1]
        } colors`;
      requirements.push(colorDesc);
    }

    // Add custom elements
    if (options.customElements) {
      requirements.push(...options.customElements);
    }

    return requirements.join(", ");
  }

  /**
   * Get default negative prompts for quality control
   */
  private getDefaultNegatives(): string[] {
    return [
      "no realistic details",
      "no photorealistic details",
      "no shading detail",
      "no gradients",
      "no 3D effects",
      "no complex textures",
    ];
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate(
    template: string,
    request: LogoRequest,
    options: GenerationOptions,
  ): string {
    let result = template;

    // Replace basic variables
    result = result.replace(/\[COMPANY\]/g, request.company);
    result = result.replace(/\[PROMPT\]/g, request.prompt);
    result = result.replace(/\[STYLE\]/g, options.style || "modern");
    result = result.replace(/\[INDUSTRY\]/g, options.industry || "business");

    // Replace color variables
    if (options.colors && options.colors.length > 0) {
      result = result.replace(/\[PRIMARY_COLOR\]/g, options.colors[0]);
      result = result.replace(
        /\[SECONDARY_COLOR\]/g,
        options.colors[1] || options.colors[0],
      );
      result = result.replace(
        /\[COLOR_PALETTE\]/g,
        options.colors.join(" and "),
      );
    }

    return result;
  }

  /**
   * Get available templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): ProfessionalTemplate[] {
    return Array.from(this.templates.values())
      .filter((template) => template.category === category);
  }

  /**
   * Get templates suitable for industry
   */
  getTemplatesForIndustry(industry: Industry): ProfessionalTemplate[] {
    return Array.from(this.templates.values())
      .filter((template) =>
        template.industryFit.includes(industry) ||
        template.industryFit.length === 0
      );
  }

  /**
   * Get template by ID
   */
  getTemplate(id: LogoTemplate): ProfessionalTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Initialize professional template library
   */
  private initializeProfessionalTemplates(): void {
    // Minimal Category Templates
    this.templates.set("minimal-geometric", {
      id: "minimal-geometric",
      name: "Clean Geometric",
      description: "Minimalist geometric shapes with clean lines",
      category: "minimal",
      complexity: "basic",
      basePrompt:
        "Minimalist geometric logo, [SHAPE] form, flat vector design, [PRIMARY_COLOR] on white background, sharp edges, scalable",
      negativePrompts: ["no gradients", "no 3D effects", "no ornate details"],
      requiredParams: ["company"],
      optionalParams: { shape: "circle", primaryColor: "blue" },
      industryFit: [],
      examples: [
        "Circle tech logo",
        "Triangle design studio",
        "Square consulting",
      ],
      costTier: "web",
    });

    this.templates.set("minimal-lettermark", {
      id: "minimal-lettermark",
      name: "Simple Lettermark",
      description: "Single letter focus with clean typography",
      category: "minimal",
      complexity: "basic",
      basePrompt:
        "Single letter [LETTER] logo, sans-serif, bold weight, flat design, [PRIMARY_COLOR] monochrome, centered composition on white background",
      negativePrompts: [
        "no decorative elements",
        "no complex styling",
        "no shadows",
      ],
      requiredParams: ["company"],
      optionalParams: { primaryColor: "black" },
      industryFit: [],
      examples: [
        "A for Analytics Co",
        "M for Marketing Plus",
        "T for TechStart",
      ],
      costTier: "web",
    });

    // Corporate Category Templates
    this.templates.set("corporate-tech", {
      id: "corporate-tech",
      name: "Tech Startup Modern",
      description: "Modern technology company aesthetic",
      category: "corporate",
      complexity: "intermediate",
      basePrompt:
        "Modern tech company logo featuring [ELEMENT], clean minimalist style, [PRIMARY_COLOR] and [SECONDARY_COLOR] color scheme, vector design, professional, white background",
      negativePrompts: [
        "no realistic details",
        "no ornate elements",
        "no vintage styling",
      ],
      requiredParams: ["company"],
      optionalParams: {
        element: "geometric shape",
        primaryColor: "blue",
        secondaryColor: "white",
      },
      industryFit: ["technology"],
      examples: ["AI startup logo", "Software company", "Tech consultancy"],
      costTier: "web",
    });

    this.templates.set("corporate-finance", {
      id: "corporate-finance",
      name: "Financial Trust",
      description: "Conservative financial services aesthetic",
      category: "corporate",
      complexity: "intermediate",
      basePrompt:
        "Conservative financial logo, [SYMBOL] emblem, navy blue and gray palette, professional grade, symmetric composition, trustworthy design",
      negativePrompts: [
        "no casual elements",
        "no bright colors",
        "no playful styling",
      ],
      requiredParams: ["company"],
      optionalParams: { symbol: "shield", primaryColor: "navy blue" },
      industryFit: ["finance"],
      examples: ["Investment firm", "Banking service", "Financial advisor"],
      costTier: "web",
    });

    // Industry-Specific Templates
    this.templates.set("industry-healthcare", {
      id: "industry-healthcare",
      name: "Healthcare Professional",
      description: "Medical and healthcare industry focused",
      category: "industry-specific",
      complexity: "intermediate",
      basePrompt:
        "Medical [SPECIALTY] logo, [MEDICAL_SYMBOL], calming [PRIMARY_COLOR] palette, rounded shapes, trustworthy design, clean vector on white",
      negativePrompts: [
        "no sharp angles",
        "no aggressive imagery",
        "no dark themes",
      ],
      requiredParams: ["company"],
      optionalParams: {
        specialty: "practice",
        medicalSymbol: "cross",
        primaryColor: "blue",
      },
      industryFit: ["healthcare"],
      examples: ["Medical clinic", "Dental practice", "Healthcare startup"],
      costTier: "web",
    });

    this.templates.set("creative-abstract", {
      id: "creative-abstract",
      name: "Artistic Abstract",
      description: "Creative and artistic expression",
      category: "creative",
      complexity: "advanced",
      basePrompt:
        "Abstract creative logo inspired by [ART_MOVEMENT], bold [COLOR_PALETTE], dynamic composition, artistic expression, vector style",
      negativePrompts: ["no photorealistic elements", "no literal imagery"],
      requiredParams: ["company"],
      optionalParams: { artMovement: "modern art", primaryColor: "vibrant" },
      industryFit: ["creative"],
      examples: ["Design agency", "Art studio", "Creative consultancy"],
      costTier: "web",
    });

    // Minimal Category (5 total)
    this.templates.set("minimal-abstract", {
      id: "minimal-abstract",
      name: "Abstract Minimal",
      description: "Simple abstract shapes with artistic flair",
      category: "minimal",
      complexity: "intermediate",
      basePrompt:
        "Abstract minimal logo, flowing [SHAPE] design, [PRIMARY_COLOR] gradient, artistic simplicity, vector style on white background",
      negativePrompts: [
        "no complex details",
        "no realistic elements",
        "no busy patterns",
      ],
      requiredParams: ["company"],
      optionalParams: { shape: "curved", primaryColor: "blue" },
      industryFit: [],
      examples: ["Creative studio", "Design agency", "Art collective"],
      costTier: "web",
    });

    // Corporate Category (8 total)
    this.templates.set("corporate-consulting", {
      id: "corporate-consulting",
      name: "Professional Consulting",
      description: "Authoritative business consulting aesthetic",
      category: "corporate",
      complexity: "basic",
      basePrompt:
        "Professional consulting logo, clean [SYMBOL], sophisticated [PRIMARY_COLOR] and gray palette, business-grade typography, trustworthy design",
      negativePrompts: [
        "no casual styling",
        "no playful elements",
        "no bright colors",
      ],
      requiredParams: ["company"],
      optionalParams: { symbol: "abstract mark", primaryColor: "dark blue" },
      industryFit: ["consulting"],
      examples: ["Business consulting", "Strategy firm", "Management advisory"],
      costTier: "web",
    });

    this.templates.set("corporate-professional", {
      id: "corporate-professional",
      name: "General Professional",
      description: "Versatile professional business logo",
      category: "corporate",
      complexity: "basic",
      basePrompt:
        "Clean professional business logo, [ELEMENT] symbol, modern [PRIMARY_COLOR] palette, scalable design, corporate identity",
      negativePrompts: [
        "no informal elements",
        "no artistic flourishes",
        "no complex imagery",
      ],
      requiredParams: ["company"],
      optionalParams: { element: "geometric", primaryColor: "navy" },
      industryFit: ["consulting", "finance", "technology"],
      examples: ["Law firm", "Accounting", "Business services"],
      costTier: "web",
    });

    // Creative Category (7 total)
    this.templates.set("creative-artistic", {
      id: "creative-artistic",
      name: "Artistic Expression",
      description: "Bold artistic and creative design",
      category: "creative",
      complexity: "advanced",
      basePrompt:
        "Artistic logo inspired by [ART_STYLE], creative expression, bold [COLOR_PALETTE], dynamic visual impact, artistic vector design",
      negativePrompts: [
        "no corporate styling",
        "no conservative colors",
        "no rigid structure",
      ],
      requiredParams: ["company"],
      optionalParams: { artStyle: "modern art", primaryColor: "vibrant" },
      industryFit: ["creative", "entertainment"],
      examples: ["Art gallery", "Creative agency", "Design studio"],
      costTier: "web",
    });

    this.templates.set("creative-playful", {
      id: "creative-playful",
      name: "Playful Creative",
      description: "Fun and approachable creative design",
      category: "creative",
      complexity: "intermediate",
      basePrompt:
        "Playful creative logo, fun [ELEMENT], bright [COLOR_PALETTE], friendly design, approachable aesthetic, vector style",
      negativePrompts: [
        "no serious tone",
        "no dark colors",
        "no formal structure",
      ],
      requiredParams: ["company"],
      optionalParams: { element: "shapes", primaryColor: "bright" },
      industryFit: ["creative", "education"],
      examples: ["Kids brand", "Entertainment", "Creative workshop"],
      costTier: "web",
    });

    // Industry-Specific Category (10+ total)
    this.templates.set("industry-tech", {
      id: "industry-tech",
      name: "Technology Focus",
      description: "Technology and innovation focused",
      category: "industry-specific",
      complexity: "intermediate",
      basePrompt:
        "Technology logo featuring [TECH_ELEMENT], innovative design, [PRIMARY_COLOR] tech palette, modern digital aesthetic, scalable vector",
      negativePrompts: [
        "no outdated styling",
        "no organic elements",
        "no handwritten fonts",
      ],
      requiredParams: ["company"],
      optionalParams: {
        techElement: "circuit pattern",
        primaryColor: "electric blue",
      },
      industryFit: ["technology"],
      examples: ["Software company", "Tech startup", "Digital agency"],
      costTier: "web",
    });

    this.templates.set("industry-finance", {
      id: "industry-finance",
      name: "Financial Services",
      description: "Banking and finance industry standard",
      category: "industry-specific",
      complexity: "basic",
      basePrompt:
        "Financial services logo, [SYMBOL] emblem, trustworthy [PRIMARY_COLOR] palette, stable design, professional banking aesthetic",
      negativePrompts: [
        "no risky imagery",
        "no bright colors",
        "no playful elements",
      ],
      requiredParams: ["company"],
      optionalParams: { symbol: "shield", primaryColor: "navy blue" },
      industryFit: ["finance"],
      examples: ["Bank", "Investment firm", "Insurance company"],
      costTier: "web",
    });

    this.templates.set("industry-food", {
      id: "industry-food",
      name: "Food & Beverage",
      description: "Restaurant and food industry focused",
      category: "industry-specific",
      complexity: "intermediate",
      basePrompt:
        "Food and beverage logo, [FOOD_ELEMENT], appetizing [COLOR_PALETTE], warm inviting design, culinary aesthetic, vector style",
      negativePrompts: [
        "no cold colors",
        "no industrial look",
        "no tech elements",
      ],
      requiredParams: ["company"],
      optionalParams: { foodElement: "chef hat", primaryColor: "warm red" },
      industryFit: ["food"],
      examples: ["Restaurant", "Food truck", "Catering service"],
      costTier: "web",
    });

    this.templates.set("industry-education", {
      id: "industry-education",
      name: "Educational Institution",
      description: "Schools and educational services",
      category: "industry-specific",
      complexity: "basic",
      basePrompt:
        "Educational logo featuring [EDU_SYMBOL], learning-focused design, [PRIMARY_COLOR] academic palette, trustworthy educational aesthetic",
      negativePrompts: [
        "no childish elements",
        "no commercial styling",
        "no bright neon",
      ],
      requiredParams: ["company"],
      optionalParams: { eduSymbol: "book", primaryColor: "academic blue" },
      industryFit: ["education"],
      examples: ["School", "Online course", "Training center"],
      costTier: "web",
    });

    // Additional specialty templates
    this.templates.set("minimal-wordmark", {
      id: "minimal-wordmark",
      name: "Clean Wordmark",
      description: "Typography-focused minimal design",
      category: "minimal",
      complexity: "basic",
      basePrompt:
        "Clean wordmark logo for [COMPANY], minimal typography, [PRIMARY_COLOR] lettering, modern sans-serif style, simple and readable",
      negativePrompts: [
        "no decorative elements",
        "no symbols",
        "no complex styling",
      ],
      requiredParams: ["company"],
      optionalParams: { primaryColor: "black" },
      industryFit: [],
      examples: ["Google", "Sony", "Netflix style"],
      costTier: "web",
    });

    this.templates.set("minimal-emblem", {
      id: "minimal-emblem",
      name: "Simple Emblem",
      description: "Badge-style minimal emblem",
      category: "minimal",
      complexity: "intermediate",
      basePrompt:
        "Simple emblem logo, circular badge design, [COMPANY] text, [PRIMARY_COLOR] and white, clean minimal styling, vector badge",
      negativePrompts: [
        "no ornate details",
        "no complex patterns",
        "no gradients",
      ],
      requiredParams: ["company"],
      optionalParams: { primaryColor: "dark blue" },
      industryFit: [],
      examples: ["Vintage badge", "Certification mark", "Club emblem"],
      costTier: "web",
    });

    // More corporate templates
    this.templates.set("corporate-startup", {
      id: "corporate-startup",
      name: "Modern Startup",
      description: "Contemporary startup aesthetic",
      category: "corporate",
      complexity: "intermediate",
      basePrompt:
        "Modern startup logo, innovative [ELEMENT], fresh [PRIMARY_COLOR] palette, dynamic design, entrepreneurial spirit, scalable vector",
      negativePrompts: [
        "no traditional styling",
        "no conservative colors",
        "no formal structure",
      ],
      requiredParams: ["company"],
      optionalParams: { element: "arrow", primaryColor: "vibrant blue" },
      industryFit: ["technology"],
      examples: ["Tech startup", "Innovation lab", "Venture firm"],
      costTier: "web",
    });

    this.templates.set("corporate-legal", {
      id: "corporate-legal",
      name: "Legal Professional",
      description: "Law firm and legal services",
      category: "corporate",
      complexity: "basic",
      basePrompt:
        "Legal services logo, [LEGAL_SYMBOL], authoritative [PRIMARY_COLOR] palette, professional law firm design, trustworthy aesthetic",
      negativePrompts: [
        "no casual elements",
        "no bright colors",
        "no playful styling",
      ],
      requiredParams: ["company"],
      optionalParams: {
        legalSymbol: "scales of justice",
        primaryColor: "deep blue",
      },
      industryFit: ["legal"],
      examples: ["Law firm", "Legal clinic", "Attorney office"],
      costTier: "web",
    });

    // More creative templates
    this.templates.set("creative-modern", {
      id: "creative-modern",
      name: "Modern Creative",
      description: "Contemporary creative expression",
      category: "creative",
      complexity: "intermediate",
      basePrompt:
        "Modern creative logo, contemporary [ELEMENT], sophisticated [COLOR_PALETTE], artistic yet professional, creative industry standard",
      negativePrompts: [
        "no outdated styling",
        "no cliché elements",
        "no overly busy design",
      ],
      requiredParams: ["company"],
      optionalParams: {
        element: "abstract form",
        primaryColor: "sophisticated",
      },
      industryFit: ["creative"],
      examples: ["Design studio", "Creative consultancy", "Branding agency"],
      costTier: "web",
    });

    this.templates.set("creative-handcraft", {
      id: "creative-handcraft",
      name: "Handcraft Artisan",
      description: "Artisanal and handmade aesthetic",
      category: "creative",
      complexity: "advanced",
      basePrompt:
        "Handcraft artisan logo, [CRAFT_ELEMENT], organic [COLOR_PALETTE], handmade aesthetic, artisanal quality, authentic design",
      negativePrompts: [
        "no digital styling",
        "no corporate look",
        "no perfect geometry",
      ],
      requiredParams: ["company"],
      optionalParams: {
        craftElement: "handmade symbol",
        primaryColor: "earthy",
      },
      industryFit: ["creative"],
      examples: ["Pottery studio", "Craft workshop", "Artisan goods"],
      costTier: "web",
    });

    this.templates.set("creative-entertainment", {
      id: "creative-entertainment",
      name: "Entertainment Brand",
      description: "Entertainment and media industry",
      category: "creative",
      complexity: "advanced",
      basePrompt:
        "Entertainment logo, [MEDIA_ELEMENT], dynamic [COLOR_PALETTE], energetic design, entertainment industry standard, engaging visual",
      negativePrompts: [
        "no boring design",
        "no corporate styling",
        "no muted colors",
      ],
      requiredParams: ["company"],
      optionalParams: {
        mediaElement: "play button",
        primaryColor: "energetic",
      },
      industryFit: ["entertainment"],
      examples: ["Media company", "Entertainment venue", "Production studio"],
      costTier: "web",
    });

    // More industry-specific templates
    this.templates.set("industry-real-estate", {
      id: "industry-real-estate",
      name: "Real Estate Professional",
      description: "Real estate and property services",
      category: "industry-specific",
      complexity: "basic",
      basePrompt:
        "Real estate logo, [PROPERTY_SYMBOL], trustworthy [PRIMARY_COLOR] palette, professional property design, real estate industry standard",
      negativePrompts: [
        "no casual styling",
        "no playful elements",
        "no bright colors",
      ],
      requiredParams: ["company"],
      optionalParams: {
        propertySymbol: "house",
        primaryColor: "professional blue",
      },
      industryFit: ["real-estate"],
      examples: [
        "Real estate agency",
        "Property management",
        "Construction company",
      ],
      costTier: "web",
    });

    this.templates.set("industry-automotive", {
      id: "industry-automotive",
      name: "Automotive Services",
      description: "Auto and transportation industry",
      category: "industry-specific",
      complexity: "intermediate",
      basePrompt:
        "Automotive logo, [AUTO_ELEMENT], strong [PRIMARY_COLOR] palette, mechanical precision, automotive industry aesthetic, durable design",
      negativePrompts: [
        "no delicate elements",
        "no pastel colors",
        "no organic shapes",
      ],
      requiredParams: ["company"],
      optionalParams: { autoElement: "gear", primaryColor: "metallic blue" },
      industryFit: ["automotive"],
      examples: ["Auto repair", "Car dealership", "Transportation service"],
      costTier: "web",
    });

    // Specialty templates for specific use cases
    this.templates.set("industry-wellness", {
      id: "industry-wellness",
      name: "Health & Wellness",
      description: "Wellness and lifestyle services",
      category: "industry-specific",
      complexity: "intermediate",
      basePrompt:
        "Health and wellness logo, [WELLNESS_SYMBOL], calming [PRIMARY_COLOR] palette, holistic design, wellness industry aesthetic, balanced composition",
      negativePrompts: [
        "no medical symbols",
        "no harsh colors",
        "no rigid geometry",
      ],
      requiredParams: ["company"],
      optionalParams: {
        wellnessSymbol: "zen circle",
        primaryColor: "calming green",
      },
      industryFit: ["healthcare"],
      examples: ["Spa", "Yoga studio", "Wellness center"],
      costTier: "web",
    });

    this.templates.set("industry-nonprofit", {
      id: "industry-nonprofit",
      name: "Non-Profit Organization",
      description: "Charitable and non-profit organizations",
      category: "industry-specific",
      complexity: "basic",
      basePrompt:
        "Non-profit logo, [MISSION_SYMBOL], compassionate [PRIMARY_COLOR] palette, community-focused design, charitable organization aesthetic",
      negativePrompts: [
        "no commercial styling",
        "no luxury elements",
        "no corporate coldness",
      ],
      requiredParams: ["company"],
      optionalParams: {
        missionSymbol: "helping hands",
        primaryColor: "warm blue",
      },
      industryFit: ["nonprofit"],
      examples: ["Charity", "Foundation", "Community organization"],
      costTier: "web",
    });
  }
}
