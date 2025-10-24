import fs from "fs";
import { GoogleGenAI } from "@google/genai";

async function main() {
    const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

    const simulation_file = "simulations.json";
    const simulationsData = JSON.parse(fs.readFileSync(simulation_file, "utf-8"));
    //console.log(simulationsData);
    //console.log(Array.isArray(simulationsData));
    console.log(simulationsData.simulations);
    for (const sim of simulationsData) {
        const textToEmbed = `
          Name: ${sim.name}
          Description: ${sim.description}
          Concepts: ${sim.concepts.join(", ")}
          Parameters: ${sim.parameters.join(", ")}
        `;
        console.log(`Generating embedding for: ${sim.name}`);

        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: [textToEmbed],
            taskType: "SEMANTIC_SIMILARITY"
        });

        sim.embedding = response.embeddings[0].values;
    }

    fs.writeFileSync("embedded_simulations.json", JSON.stringify(simulationsData, null, 2));
    console.log("✅ All embeddings saved to embedded_simulations.json");
}

main().catch(err => console.error(err));
