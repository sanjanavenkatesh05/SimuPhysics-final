// generateEmbeddings.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// NOTE: import name may differ by SDK release. Check your installed package docs.
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY }); // SDK init per docs

const META_PATH = path.resolve("simulations.json");
const OUT_PATH = path.resolve("embedded_simulations.json");
const MODEL = "gemini-embedding-001"; // new recommended embedding model. See Google blog/docs. :contentReference[oaicite:2]{index=2}

async function embedText(text) {
  // The exact method name depends on SDK version. Most recent docs show an embed_content style call.
  // Replace the call below with SDK-equivalent if your package exposes e.g. client.models.embedContent(...) 
  const res = await client.models.embedContent?.({ model: MODEL, contents: text }) // SDK helper (pseudocode)
    || await client.embed?.({ model: MODEL, input: text }); // fallback shapes - adapt to your SDK
  // Normalise to an array of floats
  const emb = res?.embeddings?.[0]?.values || res?.embedding || res?.data?.[0]?.embedding || res;
  return emb;
}

async function main() {
  const sims = JSON.parse(fs.readFileSync(META_PATH, "utf8"));

  const embedded = [];
  for (const sim of sims) {
    const textToEmbed = [
      `Name: ${sim.name}`,
      `Description: ${sim.description}`,
      `Concepts: ${ (sim.concepts || []).join(", ") }`,
      `Examples: ${ (sim.examples || []).slice(0,5).join(" ; ") }`
    ].join("\n");

    //console.log("Embedding:", sim.name);
    const embedding = await embedText(textToEmbed);
    embedded.push({ ...sim, embedding });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(embedded, null, 2));
  console.log("Saved embeddings to", OUT_PATH);
}

main().catch(err => { console.error(err); process.exit(1); });
