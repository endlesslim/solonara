export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
  // Traits mapping: [Aggressiveness, Empathy, Realism, Humor, Style]
  // Values 0-10
  traits: [number, number, number, number, number];
}

export interface UserTraits {
  aggressiveness: number;
  empathy: number;
  realism: number;
  humor: number;
  style: number;
}

// Structured output for Gemini
export interface CharacterProfile {
  name: string; // e.g., "The Calculator Kwang-soo"
  baseName: string; // e.g., "Kwang-soo"
  catchphrase: string;
  description: string;
  famousLine: string;
  strengths: string[];
  weaknesses: string[];
  visualDescription: string; // New: For image generation
  imageUrl?: string; // New: The generated image
  matchRateReasoning?: string; // For match feature
  // New Strategy Fields
  strategy: string; // Advice for success
  idealPartner: string; // Recommended partner type
  successRate: number; // 0-100 probability
  idealPartnerVisualDescription?: string;
  idealPartnerImageUrl?: string;
}