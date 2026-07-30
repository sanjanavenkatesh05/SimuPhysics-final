import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import { parseParameterArray } from "./lib/responseParser.mjs";
import { validatePromptInput } from "./lib/promptValidation.mjs";
import { selectBestSimulation } from "./lib/simulationMatcher.mjs";
import { config } from "./lib/config.mjs";

const app = express();




app.use(cors());
app.use(express.json());
app.use(express.static("public"));


const prompt_solution_wrapper = "please solve this physics problem with complete explaination or explain the physics concept without starting with any other words. i just want the solution.give me response only in text. i do NOT want the meta data. i just want the text , written in html form (ex <br> for /n etc). and i dont want it enclosed in any quotes or paranthesis. and do not put newline characters like backslash ns";
const AI_MODEL = "gemini-2.5-flash";
const EMBEDDING_MODEL = "gemini-embedding-001";

if (!config.geminiApiKey) {
  console.warn("GEMINI_API_KEY is not set. AI requests will fail until it is configured.");
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
const embeddedSimulations = JSON.parse(fs.readFileSync("./embedded_simulations.json", "utf-8"));



const port = config.port;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const simsDirectoryPath = config.simsDirectoryPath;
app.use('/sims', express.static(simsDirectoryPath));

function buildErrorResponse(message, status = 500) {
  return {
    success: false,
    error: message,
    status
  };
}

app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "simuphysics"
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SimuPhysics API is running.",
    endpoints: [
      "GET /health",
      "POST /api/prompt"
    ]
  });
});

// === MAIN ENDPOINT ===
app.post(["/api/prompt", "/api/v1/prompt"], async (req, res) => {
  const { prompt } = req.body;
  const validation = validatePromptInput(prompt);

  if (!validation.valid) {
    return res.status(400).json(buildErrorResponse(validation.error, 400));
  }

  const safePrompt = validation.prompt;
  console.log(" Received prompt:", safePrompt);

  try {
    // Step 1 — Generate embedding for user prompt
    const embedResponse = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [safePrompt],
      taskType: "SEMANTIC_SIMILARITY"
    });

    const promptEmbedding = embedResponse.embeddings[0].values;
    const { bestMatch, bestScore, scores } = selectBestSimulation(promptEmbedding, embeddedSimulations);

    console.log(" Top matches:", scores.slice(0, 3));
    console.log(" Best match:", bestMatch.script, "→", bestScore.toFixed(4));
    console.log("parameters list->", bestMatch.parameters);

    const scriptUrl = `/sims/${bestMatch.script}`;
    if (!config.geminiApiKey) {
      return res.status(500).json(buildErrorResponse("GEMINI_API_KEY is not configured.", 500));
    }
    const prompt_wrapper = `You are a highly specialized AI designed to act as a physics problem parser. Your only function is to read a physics problem and extract the values for a predefined list of parameters.Analyze the physics problem provided below: ${safePrompt}  For each parameter in the following list, extract its numerical value. ${JSON.stringify(bestMatch.parameters)}. If a parameter is not mentioned in the problem, you MUST assign its value as null.Your response must be a list of objects, with each object containing a single key-value pair.
Your entire response must be raw text, starting with [ and ending with ].`;
    //console.log(prompt_wrapper);
    let response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt_wrapper
    });
    const parameters = response.text;
    const parsedParameters = parseParameterArray(parameters);
    console.log(parameters);
    let problems = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt_solution_wrapper + safePrompt
    });
    const solutionText = problems.candidates[0].content.parts[0].text;
    // Step 3 — Send back the result
    res.json({
      success: true,
      received: safePrompt,     // For your history panel
      scriptUrl: scriptUrl,     // The URL the client will load
      parameters: parsedParameters,  // Parsed parameter array for the client
      solution: solutionText
    });

  } catch (error) {
    console.error(" Error generating embedding or matching:", error);

    res.status(500).json(buildErrorResponse(error.message || "Internal server error", 500));
  }


});
