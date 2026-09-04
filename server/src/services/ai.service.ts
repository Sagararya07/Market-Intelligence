import Anthropic from '@anthropic-ai/sdk';
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.AI_API_KEY || "dummy",
});

const ResultSchema = z.object({
  intent: z.object({ buyer: z.number(), seller: z.number(), requirement: z.number() }),
  requirement: z.object({
    title: z.string(),
    problem: z.string(),
    desiredSolution: z.string(),
    urgency: z.string(),
    timeline: z.string(),
    confidence: z.number()
  }),
  pain_points: z.array(z.object({
    title: z.string(),
    category: z.string(),
    severity: z.string(),
    confidence: z.number()
  }))
});

export type IntelligenceResult = z.infer<typeof ResultSchema>;

async function fetchWebsiteData(url: string) {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const html = await res.text();
    const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                     .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    return text.substring(0, 3000);
  } catch (err) {
    console.error(`Failed to scrape ${url}:`, err);
    return null;
  }
}


// Batch analysis function for the Intelligence Engine
export async function analyzeAccountsBatch(accounts: any[]) {
  if (!process.env.AI_API_KEY) {
    throw new Error("AI_API_KEY is not set. Please add it to your .env file.");
  }

  const results = [];
  const BATCH_SIZE = 5; // Process 5 accounts concurrently to speed up response time

  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const chunk = accounts.slice(i, i + BATCH_SIZE);
    
    const chunkPromises = chunk.map(async (account) => {
      let scrapedContext = "";
      if (account.website) {
         const webText = await fetchWebsiteData(account.website);
         if (webText) {
            scrapedContext = `\n[Real-World Context strictly extracted from their website (${account.website})]:\n${webText}\n`;
         } else {
            scrapedContext = `\n[Note: Automated scraping failed or was blocked. Fallback to general industry knowledge.]\n`;
         }
      }

      const prompt = `
      Analyze this B2B account using the factual data and the real-world context below. Generate:
      - An ICP Score (0 to 100) based on their size and industry.
      - A likely Pain Point they are facing (Base this on the real-world context if available).
      - A Market Signal (Base this strictly on the real-world context if available).
      - A Requirement for B2B enterprise software (Base this strictly on their stated business needs in the real-world context).
      
      Account Data:
      ${JSON.stringify({ id: account.id, companyName: account.companyName, industry: account.industry, employeeCount: account.employeeCount, revenueRange: account.revenueRange }, null, 2)}
      ${scrapedContext}
      
      You MUST return ONLY a raw JSON object with this exact structure (no markdown tags, no explanations):
      {
        "accountId": "${account.id}",
        "icpScore": 85,
        "marketingMaturity": "HIGH|MEDIUM|LOW",
        "technologyMaturity": "ADVANCED|GROWING|LOW",
        "primaryProblem": "string",
        "marketSignal": { "title": "string", "type": "EXPANSION_SIGNAL|TECHNOLOGY_SIGNAL", "confidence": 0.9 },
        "painPoint": { "title": "string", "category": "Operations|Security|Sales", "severity": "HIGH|MEDIUM", "confidence": 0.8 },
        "requirement": { "title": "string", "category": "string", "description": "string", "urgency": "HIGH|MEDIUM|LOW", "confidence": 0.85 }
      }
      `;

      try {
        const msg = await anthropic.messages.create({
          model: "claude-sonnet-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }]
        });

        const text = msg.content[0].type === "text" ? msg.content[0].text : "";
        if (!text) throw new Error("Empty response");

        const sanitizedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(sanitizedText);
      } catch (err) {
        console.error(`Failed to analyze account ${account.id}:`, err);
        return null;
      }
    });

    // Wait for the chunk to finish concurrently
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults.filter(r => r !== null));
  }

  return results;
}

export async function classifySignal(input: { title: string; content?: string }): Promise<IntelligenceResult> {
  if (!process.env.AI_API_KEY) {
    throw new Error("AI_API_KEY is not set. Please add it to your .env file.");
  }

  const prompt = `
  Analyze the following market signal and extract the intelligence data requested in the JSON schema.
  
  Signal Title: ${input.title}
  Signal Content: ${input.content || "N/A"}
  
  Provide realistic, business-focused intent scores (0-100), requirements, and pain points based on the signal content.
  
  You MUST return ONLY a raw JSON object with this exact structure (no markdown tags, no explanations):
  {
    "intent": { "buyer": 80, "seller": 20, "requirement": 90 },
    "requirement": { "title": "string", "problem": "string", "desiredSolution": "string", "urgency": "HIGH|MODERATE|UNKNOWN", "timeline": "string", "confidence": 0.8 },
    "pain_points": [
      { "title": "string", "category": "string", "severity": "HIGH|MODERATE", "confidence": 0.8 }
    ]
  }
  `;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  if (!text) {
    throw new Error("Failed to generate content from Claude");
  }

  const sanitizedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(sanitizedText);
}
