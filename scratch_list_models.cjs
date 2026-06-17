const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
// Try loading dotenv
try {
  require("dotenv").config({ path: path.join(__dirname, ".env.local") });
} catch (e) {}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("No GEMINI_API_KEY found in environment or .env.local");
  process.exit(1);
}

async function run() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Supported Models:");
    if (data.models) {
      data.models.forEach(m => {
        // Strip models/ prefix
        const name = m.name.replace("models/", "");
        console.log(`- ${name}`);
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
