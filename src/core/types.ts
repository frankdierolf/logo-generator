export interface LogoRequest {
  company: string;
  prompt: string;
  style?: LogoStyle;
  industry?: Industry;
  colors?: string[];
  size?: ImageSize;
  quality?: ImageQuality;
}

export interface LogoResult {
  url: string;
  revisedPrompt?: string;
  metadata: LogoMetadata;
  localPath?: string;
}

export interface LogoMetadata {
  id: string;
  timestamp: number;
  company: string;
  originalPrompt: string;
  finalPrompt: string;
  style: LogoStyle;
  industry?: Industry;
  size: ImageSize;
  quality: ImageQuality;
  cost: number;
}


export interface GenerationOptions {
  style?: LogoStyle;
  industry?: Industry;
  colors?: string[];
  size?: ImageSize;
  quality?: ImageQuality;
  variations?: number;
  model?: AIModel;
  template?: string;
  negativePrompts?: string[];
  customElements?: string[];
  iteration?: number;
  quiet?: boolean;
}

export interface BatchRequest {
  requests: LogoRequest[];
  concurrency?: number;
  outputDir?: string;
  iteration?: number;
  quiet?: boolean;
}

export interface BatchResult {
  successful: LogoResult[];
  failed: FailedGeneration[];
  stats: BatchStats;
}

export interface FailedGeneration {
  request: LogoRequest;
  error: Error;
}

export interface BatchStats {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  duration: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  basePrompt: string;
  industry: Industry;
  variations: TemplateVariation[];
  metadata: TemplateMetadata;
}

export interface TemplateVariation {
  name: string;
  modifier: string;
  description: string;
}

export interface TemplateMetadata {
  author: string;
  version: string;
  tags: string[];
  created: number;
  updated: number;
}

export interface BrandGuidelines {
  name: string;
  colors: string[];
  fonts?: string[];
  style: LogoStyle;
  industry: Industry;
  keywords: string[];
  avoid: string[];
}

export type LogoStyle =
  | "modern"
  | "vintage"
  | "minimal"
  | "playful"
  | "classic"
  | "bold"
  | "elegant"
  | "tech"
  | "geometric"
  | "abstract"
  | "wordmark"
  | "lettermark"
  | "pictorial"
  | "emblem"
  | "combination"
  | "corporate";

export type AIModel = "gpt-image-1";

export type LogoTemplate =
  | "minimal-geometric"
  | "minimal-lettermark"
  | "minimal-abstract"
  | "minimal-wordmark"
  | "minimal-emblem"
  | "corporate-tech"
  | "corporate-finance"
  | "corporate-consulting"
  | "corporate-professional"
  | "corporate-startup"
  | "corporate-legal"
  | "creative-abstract"
  | "creative-artistic"
  | "creative-playful"
  | "creative-modern"
  | "creative-handcraft"
  | "creative-entertainment"
  | "industry-healthcare"
  | "industry-tech"
  | "industry-finance"
  | "industry-food"
  | "industry-education"
  | "industry-real-estate"
  | "industry-automotive"
  | "industry-wellness"
  | "industry-nonprofit";

export type Industry =
  | "technology"
  | "healthcare"
  | "finance"
  | "retail"
  | "education"
  | "food"
  | "real-estate"
  | "consulting"
  | "creative"
  | "automotive"
  | "entertainment"
  | "legal"
  | "nonprofit";

export type ImageSize =
  | "1024x1024"
  | "1024x1792"
  | "1792x1024";

export type ImageQuality = "standard" | "hd";

export interface ConfigOptions {
  apiKey?: string;
  defaultStyle?: LogoStyle;
  defaultQuality?: ImageQuality;
  defaultSize?: ImageSize;
  defaultModel?: AIModel;
  outputDir?: string;
}

export interface ProfessionalTemplate {
  id: LogoTemplate;
  name: string;
  description: string;
  category: TemplateCategory;
  complexity: TemplateComplexity;
  basePrompt: string;
  negativePrompts: string[];
  requiredParams: string[];
  optionalParams: TemplateParams;
  industryFit: Industry[];
  examples: string[];
  costTier: QualityTier;
}

export interface TemplateParams {
  primaryColor?: string;
  secondaryColor?: string;
  shape?: string;
  element?: string;
  modifier?: string;
  symbol?: string;
  specialty?: string;
  artMovement?: string;
  artStyle?: string;
  techElement?: string;
  foodElement?: string;
  eduSymbol?: string;
  medicalSymbol?: string;
  legalSymbol?: string;
  craftElement?: string;
  mediaElement?: string;
  propertySymbol?: string;
  autoElement?: string;
  wellnessSymbol?: string;
  missionSymbol?: string;
}

export type TemplateCategory =
  | "minimal"
  | "corporate"
  | "creative"
  | "industry-specific";

export type TemplateComplexity =
  | "basic"
  | "intermediate"
  | "advanced";

export type QualityTier =
  | "preview" // Low quality - $0.02
  | "web" // Medium quality - $0.07
  | "print"; // High quality - $0.19
