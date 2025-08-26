# Logo CLI for Claude Code

> Ultra-simple professional logo generation with AI assistance

🎯 **Two commands. That's it.** Create amazing logos through Claude Code in minutes.

## Quick Start

**Step 1: Set your API key**
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

**Step 2: Start session in Claude Code**
```bash
!deno run --allow-all jsr:@logocli/logo-generator start
```

**That's it!** Claude now knows everything and will guide you through creating the perfect logo.

---

## What Happens Next

Claude will:
1. Ask about your company (name, industry, style preferences)
2. Create `iteration-1-batch.json` with diverse logo explorations
3. Generate 5-10 logos in `./logos/iteration-1/`  
4. Ask which styles you prefer
5. Create refined variations in `iteration-2/`, `iteration-3/`
6. Continue until you have the perfect logo

**Cost**: $0.80-$3.20 (20-40 logos across 3-4 iterations)  
**Time**: 10-15 minutes  
**Result**: 3-5 perfect logo options organized in folders

## Manual Usage (Without Claude Code)

**Single logo:**
```bash
deno run --allow-all jsr:@logocli/logo-generator generate \
  --company "TechCorp" \
  --prompt "modern tech startup logo"
```

**Batch generation:**
```bash
# See JSON format examples
deno run --allow-all jsr:@logocli/logo-generator batch --help-examples

# Run a batch file
deno run --allow-all jsr:@logocli/logo-generator batch --file logos.json --iteration 1
```

**Configuration:**
```bash
# Set API key permanently
deno run --allow-all jsr:@logocli/logo-generator config --api-key "sk-..."
```

## How It Works

Claude uses just 3 commands:
- `generate` - Single logos or variations
- `batch` - Multiple logos from JSON files  
- `batch --help-examples` - See JSON format examples

All logos are organized in `./logos/iteration-N/` folders with automatic progress tracking.

## Requirements

- [Deno 2.0+](https://deno.com/) 
- OpenAI API key with image generation access
- $0.04 per standard logo, $0.08 per HD logo

---

🎯 **Ready to create amazing logos with Claude Code!** 🎨

Just run `!deno run --allow-all jsr:@logocli/logo-generator start` in Claude Code and you're off to the races!
