import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.AI_API_KEY,
});

async function main() {
  try {
    const models = await anthropic.models.list();
    console.log("Available models:");
    models.data.forEach(m => console.log(m.id));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}
main();
