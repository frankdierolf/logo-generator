# Logo CLI

> Generate professional logos from text using AI

```
🎨 Generating logo...
Company: TechCorp
Prompt: modern tech startup logo

✅ Successfully generated 1 logo(s)

Logo 1:
  URL: https://oaidalleapiprodscus...
  ID: logo_abc123
  Cost: $0.070

📥 Downloading to ./logos...
✅ Download complete!
  1. techcorp-modern-2025-08-25-abc123.png

💰 Total cost: $0.070
```

## Try it (2 minutes)

```bash
# 1. Get the code
git clone <this-repo> && cd logocreation

# 2. Set your OpenAI API key
export OPENAI_API_KEY="sk-your-key-here"

# 3. Generate your first logo
deno run --allow-all main.ts wizard
```

That's it! The wizard will guide you through creating a professional logo.

## Quick Examples

**Most common:** Use the interactive wizard (recommended)

```bash
deno run --allow-all main.ts wizard
```

**Quick logo:** Generate directly from command line

```bash
deno run --allow-all main.ts generate \
  --company "TechCorp" \
  --prompt "modern tech startup logo"
```

**With templates:** Use professional templates for better results

```bash
# See available templates
deno run --allow-all main.ts browse

# Use a template
deno run --allow-all main.ts generate \
  --template minimal-geometric \
  --company "StartupCo" \
  --prompt "clean logo"
```

**Multiple variations:** Generate 3 different versions

```bash
deno run --allow-all main.ts generate \
  --company "MyBrand" \
  --prompt "elegant fashion logo" \
  --variations 3 \
  --colors "black,gold"
```

**Batch processing:** Generate many logos from a file

```bash
deno run --allow-all main.ts batch --file examples/batch-logos.json
```

## What You Get

- **26+ Professional templates** for different industries
- **GPT-image-1 model** - better text accuracy than DALL-E
- **Interactive wizard** - no command line knowledge needed
- **Batch processing** - generate hundreds of logos at once
- **Smart prompts** - templates turn simple ideas into detailed prompts

## Pricing

- Standard quality: $0.07 per logo
- HD quality: $0.19 per logo

## Requirements

- [Deno 2.0+](https://deno.com/) (JavaScript/TypeScript runtime)
- OpenAI API key with image generation access

## Advanced Workflow: Using with Claude Code

One of the most powerful ways to use Logo CLI is in combination with Claude Code
for rapid iteration and exploration. Here's the workflow we discovered:

### The Iterative Discovery Process

**1. Start with exploration** - Generate initial variations to find a direction:

```bash
# Generate multiple styles to explore different concepts
deno run --allow-all main.ts generate \
  --company "YourCompany" \
  --prompt "your initial idea" \
  --variations 10 \
  --style minimal
```

**2. Review and identify winners** - Look through generated logos to find what
resonates:

```bash
# Check your generated logos
ls ./test-logos/
# View specific images that catch your eye
```

**3. Create targeted batch variations** - Once you find a style you like, create
a batch file with creative variations:

```json
// variations-batch.json
[
  {
    "company": "Sticky",
    "prompt": "friendly mascot character waving, minimal design",
    "style": "playful",
    "colors": ["black", "white"]
  },
  {
    "company": "Sticky",
    "prompt": "mascot character holding story book, cheerful expression",
    "style": "playful",
    "colors": ["black", "white"]
  }
  // ... more creative variations
]
```

**4. Run batch generation** in separate folders for organization:

```bash
# Create organized folders for different concepts
mkdir -p ./hover-variations
deno run --allow-all main.ts batch \
  --file hover-themed-variations.json \
  --output ./hover-variations
```

### Real Example: Finding the Perfect Logo

In our session, we discovered the perfect Sticky logo through this process:

1. **First round**: Generated 10 different styles (modern, minimal, playful,
   etc.)
2. **Found a winner**: Identified a playful mascot character that captured the
   brand
3. **Explored variations**: Created 10 mascot variations (waving, reading,
   jumping, etc.)
4. **Refined further**: Noticed the "hovering" meditation pose perfectly
   symbolized the AR hologram feature
5. **Final exploration**: Generated 10 hover-themed variations to perfect the
   concept

Total logos reviewed: 40\
Time to perfect logo: ~10 minutes\
Cost: $2.80 (40 logos × $0.07)

### Pro Tips for Claude Code Workflow

- **Let Claude Code write batch files** - Describe your variations and let
  Claude create the JSON
- **Use descriptive folder names** - `./minimal-variations`, `./hover-concepts`,
  etc.
- **Review before running** - Always inspect batch files before generation
- **Keep winners organized** - Move successful logos to a `./finals` folder
- **Document what works** - Note which prompts produced the best results

### Sample Claude Code Commands

```bash
# Ask Claude to create variations
"Create 10 variations of this mascot character in different poses"

# Request batch file creation
"Make a batch file with creative hover-themed variations, let me inspect it first"

# Organize results
"Which logos from the hover-variations folder best represent our AR feature?"
```

This iterative workflow turns logo creation from a shot-in-the-dark into a
systematic exploration process!

## Tips for Better Logos

**Good prompts:**

- ✅ "modern software company logo with geometric shapes, clean lines"
- ✅ "cozy restaurant logo with chef hat, warm colors"

**Avoid:**

- ❌ "logo" (too generic)
- ❌ "make me a nice logo" (too vague)

**Use templates when possible** - they turn simple ideas into detailed
professional prompts.

---

Ready to create amazing logos! 🎨
