import { Command } from "@cliffy/command";

export const startCommand = new Command()
  .description("Start logo design session with Claude Code")
  .action(async () => {
    // Output pure instructions for Claude - no colors, no formatting, just clean text
    console.log(`=== LOGO GENERATION SESSION STARTED ===

I'm Claude, and I'll help you create amazing logos using the Logo CLI tool.

AVAILABLE COMMANDS:
- deno run --allow-all jsr:@logocli/logo-generator generate --company "Name" --prompt "description" --variations 5 --iteration N
- deno run --allow-all jsr:@logocli/logo-generator batch --file <filename>.json --iteration N
- deno run --allow-all jsr:@logocli/logo-generator batch --help-examples

MY WORKFLOW:
1. I'll ask about your company (name, industry, description, style preferences)
2. I'll create iteration-1-batch.json with 5-10 diverse style explorations
3. I'll run: deno run --allow-all jsr:@logocli/logo-generator batch --file iteration-1-batch.json --iteration 1  
4. You'll review results in ./logos/iteration-1/ and tell me what you like
5. I'll create iteration-2-batch.json with refined variations focusing on your preferences
6. We'll continue iterating until you have the perfect logo

FOLDER STRUCTURE:
- ./logos/iteration-1/ - Initial style exploration
- ./logos/iteration-2/ - Refined variations  
- ./logos/iteration-3/ - Final color/detail variations
- ./logos/iterations.json - Complete design journey log

BATCH FILE FORMAT:
I'll create JSON files like this:
[
  {
    "company": "YourCorp",
    "prompt": "modern tech startup logo with clean geometry",
    "style": "modern",
    "colors": ["blue", "gray"],
    "quality": "standard"
  }
]

COST: $0.04 per standard logo, $0.16 per HD logo
TYPICAL SESSION: 20-40 logos across 3-4 iterations = $0.80-$6.40

Let's start! Please tell me:
- What's your company name?
- What does your company do?
- Any style preferences (modern, minimal, playful, etc.)?
- Any color preferences?`);
  });