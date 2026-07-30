# SimuPhysics

SimuPhysics is an educational physics simulation platform that combines a Node.js backend with a browser-based frontend for interactive physics experiences.

## 🚀 Deployment

The project is now configured for both Render and Vercel.

### Render

1. Push the repository to GitHub.
2. Create a new Web Service on Render.
3. Connect the repository and use:
   - Build command: `npm install`
   - Start command: `node app.mjs`
4. Add these environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `PUBLIC_BASE_URL=https://your-render-app.onrender.com`
   - `SIMS_DIRECTORY_PATH=./simulations`

### Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set the environment variables:
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `PUBLIC_BASE_URL=https://your-render-app.onrender.com`
4. Deploy.

## 🔐 Environment Variables

Use a file named `.env` locally with values such as:

```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
PUBLIC_BASE_URL=http://localhost:3000
SIMS_DIRECTORY_PATH=./simulations
```

## ✅ Verification

Run the following locally before deploying:

```bash
npm test
node app.mjs
```

The app should respond on `/health` once the server is running.
