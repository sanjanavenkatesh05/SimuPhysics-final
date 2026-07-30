import dotenv from 'dotenv';

dotenv.config();

function getEnv(name, fallback) {
    const value = process.env[name];
    return value === undefined ? fallback : value;
}

export const config = {
    port: Number(getEnv('PORT', '3000')),
    geminiApiKey: getEnv('GEMINI_API_KEY', ''),
    simsDirectoryPath: getEnv('SIMS_DIRECTORY_PATH', './simulations'),
    publicBaseUrl: getEnv('PUBLIC_BASE_URL', ''),
    nodeEnv: getEnv('NODE_ENV', 'development')
};
