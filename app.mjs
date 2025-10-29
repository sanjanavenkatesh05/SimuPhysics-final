import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import cosineSimilarity from "compute-cosine-similarity";

dotenv.config();
const app = express();




app.use(cors());
app.use(express.json());
app.use(express.static("public"));


const prompt_solution_wrapper="please solve this physics problem with complete explaination or explain the physics concept without starting with any other words. i just want the solution.give me response only in text. i do NOT want the meta data. i just want the text. and i dont want it enclosed in any quotes or paranthesis.";
const ai=new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const embeddedSimulations = JSON.parse(fs.readFileSync("./embedded_simulations.json", "utf-8"));



const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


const simsDirectoryPath = "C:\\simuphysics\\hii";
app.use('/sims', express.static(simsDirectoryPath));

// Helper: safely extract text from Gemini responses (if needed later)
function extractText(candidate) {
  if (!candidate) return '';
  if (Array.isArray(candidate.content)) {
    return candidate.content.map(item => (item.text ? item.text : '')).join(' ');
  } else if (candidate.content?.text) {
    return candidate.content.text;
  }
  return '';
}

// === MAIN ENDPOINT ===
app.post("/api/prompt", async (req, res) => {
  const { prompt } = req.body;
  let bestMatch = null;
  let bestScore = -Infinity;
  const allScores = [];
  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt is required" });
  }

  console.log(" Received prompt:", prompt);

  try {
    // Step 1 — Generate embedding for user prompt
    const embedResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [prompt],
      taskType: "SEMANTIC_SIMILARITY"
    });

    const promptEmbedding = embedResponse.embeddings[0].values;

    // Step 2 — Compute cosine similarity with stored simulations


    for (const sim of embeddedSimulations) {
      const score = cosineSimilarity(promptEmbedding, sim.embedding);
      allScores.push({ name: sim.name, score });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sim;
      }
    }

    // Sort all scores (optional, for top-N matches)
    allScores.sort((a, b) => b.score - a.score);

    console.log(" Top matches:", allScores.slice(0, 3));
    console.log(" Best match:", bestMatch.script, "→", bestScore.toFixed(4));
    console.log("parameters list->",bestMatch.parameters);

    const scriptUrl = `/sims/${bestMatch.script}`;
     const prompt_wrapper=`You are a highly specialized AI designed to act as a physics problem parser. Your only function is to read a physics problem and extract the values for a predefined list of parameters.Analyze the physics problem provided below: ${prompt}  For each parameter in the following list, extract its numerical value. ${JSON.stringify(bestMatch.parameters)}. If a parameter is not mentioned in the problem, you MUST assign its value as null.Your response must be a list of objects, with each object containing a single key-value pair.
Your entire response must be raw text, starting with [ and ending with ].`;
  //console.log(prompt_wrapper);
  let response=await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt_wrapper
  });
  const parameters=response.text;//this is a string, needs to be parsed by the browser script, actually it does not 
  console.log(parameters);
  let problems=await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt_solution_wrapper+prompt
  });  
  const solutionText = problems.candidates[0].content.parts[0].text;
    // Step 3 — Send back the result
res.json({
        success: true,
        received: prompt,     // For your history panel
        scriptUrl: scriptUrl,     // The URL the client will load
       parameters: parameters,  // The parameter string from the AI
       solution:solutionText
    });

  } catch (error) {
    console.error(" Error generating embedding or matching:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }


});
