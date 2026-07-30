import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { parseParameterArray } from "./lib/responseParser.mjs";
import { validatePromptInput } from "./lib/promptValidation.mjs";
import { selectBestSimulation } from "./lib/simulationMatcher.mjs";
import { config } from "./lib/config.mjs";
import { shouldAllowPrompt } from "./lib/promptGate.mjs";
import { isRateLimited } from "./lib/rateLimiter.mjs";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://simuphysics-final.onrender.com",
  "https://simuphysics-final.vercel.app",
  "https://simuphysics.onrender.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


const prompt_solution_wrapper = "please solve this physics problem with complete explaination or explain the physics concept without starting with any other words. i just want the solution.give me response only in text. i do NOT want the meta data. i just want the text , written in html form (ex <br> for /n etc). and i dont want it enclosed in any quotes or paranthesis. and do not put newline characters like backslash ns";
const AI_MODEL = "gemini-2.5-flash";
const EMBEDDING_MODEL = "gemini-embedding-001";

if (!config.geminiApiKey) {
  console.warn("GEMINI_API_KEY is not set. AI requests will fail until it is configured.");
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
const embeddedSimulationsPath = path.join(__dirname, "embedded_simulations.json");
const embeddedSimulations = JSON.parse(fs.readFileSync(embeddedSimulationsPath, "utf-8"));



const port = config.port;
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

const simsDirectoryPath = config.simsDirectoryPath;
const resolvedSimsDirectoryPath = path.isAbsolute(simsDirectoryPath)
  ? simsDirectoryPath
  : path.join(__dirname, simsDirectoryPath);
app.use('/sims', express.static(resolvedSimsDirectoryPath));

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
  const indexPath = path.join(__dirname, "public", "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

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
  const gateResult = shouldAllowPrompt(safePrompt);

  if (!gateResult.allowed) {
    return res.status(400).json(buildErrorResponse(gateResult.reason, 400));
  }

  const clientKey = req.ip || 'unknown-client';
  if (isRateLimited(clientKey, 60000, 10)) {
    return res.status(429).json(buildErrorResponse('Too many requests. Please try again shortly.', 429));
  }

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

export default app;
