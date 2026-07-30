# SimuPhysics

SimuPhysics is a modern educational physics platform that turns natural-language prompts into interactive, visual simulations. Users can describe a concept or problem, receive an AI-generated explanation, and immediately see a matching 2D simulation rendered in the browser.

## Live Demo

Explore the project here:

https://simuphysics-final.onrender.com/

## Overview

The platform combines a lightweight Node.js backend with a polished frontend experience. It is designed for students, teachers, and curious learners who want to understand physics through visual intuition rather than only equations.

### What the app offers

- Natural-language physics prompts
- AI-generated explanations and extracted parameters
- Dynamic simulation loading for a wide range of topics
- Interactive controls for tuning simulation values
- A modern, responsive interface for desktop and tablet use

## Project Highlights

### Interactive learning experience
The app takes a user prompt and matches it to an appropriate simulation. Once the simulation is selected, the interface displays the analytical explanation and launches the interactive scene in real time.

### Modern interface
The UI is built around a clear, dark, high-contrast design with dedicated panels for the prompt, simulation viewport, and solution output.

### Flexible backend architecture
The backend serves the frontend, handles prompt processing, and exposes health and prompt endpoints for deployment on cloud platforms such as Render.

## Screenshots

![SimuPhysics homepage](docs/screenshots/homepage.svg)

## Tech Stack

- Node.js and Express
- JavaScript and the browser DOM
- Matter.js for physics-based rendering
- Gemini-powered prompt processing and explanation generation
- Render-friendly deployment structure

## Local Development

Install dependencies:

```bash
npm install
```

Run the tests:

```bash
npm test
```

Start the server locally:

```bash
node app.mjs
```

The app will be available locally at:

```text
http://localhost:3000
```

## Environment Variables

A sample environment file is available in [.env.example](.env.example).

Example values:

```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
PUBLIC_BASE_URL=http://localhost:3000
SIMS_DIRECTORY_PATH=./simulations
```

## Deployment

The project is configured for deployment on Render and can also be adapted for Vercel if you want to separate the frontend and backend.

### Render

- Build command: `npm install`
- Start command: `node app.mjs`
- Required environment variables:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `GEMINI_API_KEY=your_gemini_api_key`
  - `PUBLIC_BASE_URL=https://simuphysics-final.onrender.com/`
  - `SIMS_DIRECTORY_PATH=./simulations`

## License

This project is intended for educational and demonstration purposes.
