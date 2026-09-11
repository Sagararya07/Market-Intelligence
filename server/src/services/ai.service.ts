import OpenAI from 'openai';
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "dummy",
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
  if (!process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Please add it to your .env file.");
  }

  const results = [];
  const BATCH_SIZE = 2; // Process 2 accounts at a time to avoid API overload

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
      - A Requirement for B2B enterprise software (Base this strictly on their stated business needs). Crucially, estimate a realistic project budget (budgetMin and budgetMax) based on their company size and revenue tier. Check the company's country/location. If they are in India, output the budget in INR. If they are in the UK, output in GBP. For others use USD. Ensure the scale is accurate to that country's market rates, and set budgetCurrency to the appropriate 3-letter currency code (e.g., INR, GBP, USD). Also extract the date when the requirement or budget was announced or declared into 'declaredAt' in YYYY-MM-DD format (or null if not found). Also provide the 'sourceUrl' where this requirement was found (if it's from the provided context, you can use the account website or the specific URL mentioned).
      
      Account Data:
      ${JSON.stringify({ id: account.id, companyName: account.companyName, industry: account.industry, employeeCount: account.employeeCount, revenueRange: account.revenueRange, website: account.website }, null, 2)}
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
        "requirement": { "title": "string", "category": "string", "description": "string", "urgency": "HIGH|MEDIUM|LOW", "confidence": 0.85, "budgetMin": 50000, "budgetMax": 150000, "budgetCurrency": "USD", "declaredAt": "2023-10-15", "sourceUrl": "https://example.com/press-release" }
      }
      `;

      const availableModels = [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo"
      ];

      for (const model of availableModels) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const completion = await openai.chat.completions.create({
              model: model,
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_object" }
            });

            const text = completion.choices[0].message.content;
            if (!text) break; // Try next model

            const sanitizedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(sanitizedText);
          } catch (err: any) {
            if (err?.status === 404) {
              console.log(`Model ${model} not available, trying fallback...`);
              break; // Try next model
            }
            if (err?.status === 429 || err?.status === 529 || err?.status === 503 || (err?.message && err.message.includes('overloaded'))) {
              console.log(`API overloaded for ${account.name || account.companyName} (attempt ${attempt}/3), retrying in ${attempt * 5}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 5000));
              continue; // Retry same model
            }
            console.error(`Failed to analyze account ${account.id} with ${model}:`, err?.message || err);
            return null;
          }
        }
      }
      console.error(`All OpenAI models failed for account ${account.id}.`);
      return null;
    });

    // Wait for the chunk to finish concurrently
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults.filter(r => r !== null));
  }

  return results;
}

export async function classifySignal(input: { title: string; content?: string }): Promise<IntelligenceResult> {
  if (!process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Please add it to your .env file.");
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const text = completion.choices[0].message.content;
  if (!text) {
    throw new Error("Failed to generate content from OpenAI");
  }

  const sanitizedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(sanitizedText);
}
