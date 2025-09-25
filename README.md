# 🐟 Floundermode Dictionary
![FLOUNDERMODE](https://github.com/user-attachments/assets/ec6a6dea-783b-42ef-8820-17f43bb2e036)

The room is quiet. Slides glow behind you. Investors wait.

You know the numbers. You know the product. But none of it lands without the right words.

*Runway. Burn rate. Conviction. Moat.*

They're more than jargon. They're the shorthand that turns a story into belief, and belief into capital.

Miss them, and attention drifts. Catch them, and the room leans in.

**That's why this dictionary exists.**

---

## What This Is

The Floundermode Dictionary is like Urban Dictionary for startups. It's where we collect the language that makes pitches work, the phrases that get passed around until they start to feel like truth.

Every founder has been there. You're three slides in, and someone asks what your "go-to-market strategy" actually means. Or you mention "product-market fit," and the room goes quiet because half the people define it differently.

This dictionary solves that. It's the shared vocabulary we need to move faster together.

Language shapes reality. When we all speak the same language, we build better companies. When we define terms clearly, we make better decisions. When we understand what words actually mean in practice, we stop talking past each other.

It's a living project. New terms get added constantly. The definitions evolve as the ecosystem does. Every pull request makes us a little more aligned.

---

## Why It Matters

I've been in too many rooms where brilliant founders lose momentum because they can't translate their vision into the language investors expect. I've watched deals stall because everyone was using the same words to mean different things.

The best founders I know aren't just great builders. They're great translators. They take complex ideas and compress them into phrases that stick. They know which words open doors and which ones close them.

This dictionary captures that knowledge. It's pattern recognition for language. It's the playbook for communicating conviction.

---

## How to Contribute

Everything flows through pull requests. Clean. Simple. Scalable.

### Easy Mode (Recommended)

1. Go to [floundermode.org](https://floundermode.org)
2. Click **Contribute**
3. Fill out the form with your term
4. Click **Create PR Automatically**
5. GitHub opens with everything pre-filled
6. Submit the pull request

The form handles the JSON generation. You focus on the insight.

### Manual Mode (For the Committed)

1. Fork this repo
2. Add a JSON file in `/terms/`
3. Follow the format below
4. Open a pull request

Here's the structure:

```json
{
  "term": "Your Term Here",
  "definition": "What it actually means in practice (max 200 chars)",
  "usage": "Real example of how it gets used (max 150 chars)",
  "related": ["Tag1", "Tag2", "Tag3", "Tag4"]
}
```

---

## Content Standards

### What Makes a Good Definition

**Truth With Bite**: The best definitions make you laugh and then make you think.

**Precision Over Politeness**: Don't soften the edges. If a term is absurd, let the absurdity show. The funniest definitions are often the most accurate ones.

**Recognition Over Explanation**: Great definitions make people go "Oh god, that's exactly what that means." They capture the unspoken truth everyone already knows.

**Useful Humor**: Even when being funny, the definition should genuinely help someone understand what the term means in practice. Maybe.

### Field Requirements

- **term**: The actual phrase (max 50 characters)
- **definition**: What it means in practice (max 200 characters)  
- **usage**: Real-world example (max 150 characters)
- **related**: Up to 4 relevant tags

### Examples

**✅ Good Example:**
```json
{
  "term": "Product-Market Fit",
  "definition": "The mythical moment when customers stop politely declining your product and start accidentally recommending it to friends.",
  "usage": "We thought we had product-market fit, but it turns out our only users were our moms and three bots.",
  "related": ["Traction", "Growth", "Validation"]
}
```

**❌ Needs Work:**
```json
{
  "term": "A Really Long Term Name That Goes On Forever",
  "definition": "This definition rambles without focus and clearly exceeds our character limit guidelines that exist to ensure maximum clarity and usability across the platform.",
  "usage": "This usage example is also way too long and violates our established constraints for optimal user experience and readability standards.",
  "related": ["Too", "Many", "Tags", "Here", "Seriously"]
}
```

---

## Quality Control

When you submit a contribution, our automated system:

1. ✅ Validates JSON format
2. ✅ Checks for duplicates
3. ✅ Generates HTML pages
4. ✅ Updates the terms manifest
5. ✅ Syncs with our voting database

If something breaks, the system will tell you exactly what to fix.

---

## Technical Setup

### Local Development

```bash
# Clone the repo
git clone https://github.com/FlounderFounder/floundermode.git
cd floundermode

# Install dependencies
npm install

# Start local server
npm run dev
# or
python3 -m http.server 8000
```

### Build Process

```bash
# Generate pages incrementally (only changed terms)
npm run generate-incremental

# Force regenerate all pages
npm run generate-force

# Legacy: Generate all pages (same as --force)
npm run generate-pages

# Validate everything
npm run validate

# Deploy (happens automatically via GitHub Pages)
```

**🚀 New: Incremental Generation**
The build system now uses intelligent incremental updates that only regenerate pages when term files have actually changed. This makes development much faster - see [INCREMENTAL_GENERATION.md](INCREMENTAL_GENERATION.md) for details.

### Tech Stack

- **Frontend**: Vanilla JavaScript, CSS, HTML
- **Database**: Supabase (PostgreSQL with real-time updates)
- **Hosting**: GitHub Pages
- **Build**: Node.js automation

Simple. Fast. Scalable.

---

## Contribution Workflow

1. **Create/Update**: Add your term JSON file
2. **Generate**: Run `npm run generate-incremental` locally (optional)
3. **Commit**: Push to your fork
4. **PR**: Create pull request to main branch
5. **Review**: Automated checks + community feedback
6. **Merge**: Goes live automatically

---

## The Vision

Language is infrastructure. When we share the same definitions, we can move faster together.

Every great ecosystem has its vocabulary. Wall Street has its terms. Silicon Valley has ours. This dictionary captures that language so new founders can learn it, experienced ones can reference it, and all of us can communicate more clearly.

Better language leads to better understanding. Better understanding leads to better decisions. Better decisions lead to better companies.

That's the compound effect I'm building toward.


---

**This dictionary exists because words matter. The right term at the right moment can change everything.**

**Let's build better language together.**

---

*Questions? Open an issue or start a discussion. Pull requests welcome.*
