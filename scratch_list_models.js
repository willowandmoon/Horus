const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("No GEMINI_API_KEY found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function run() {
  try {
    // Note: listModels is on the genAI client, or we can use the model service.
    // In @google/generative-ai, listModels might not be exposed directly in all versions, 
    // but we can try to see if it works, or we can fetch directly from the Google API via fetch.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Supported Models:");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(", ")})`);
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
