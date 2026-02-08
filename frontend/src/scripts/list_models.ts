import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const apiKey = envConfig.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('No API key found in .env');
    process.exit(1);
}

console.log('Using API Key:', apiKey.substring(0, 10) + '...');

async function listModels() {
    try {
        // Fetch models using REST API directly to see what's available
        // The SDK might hide some details or use specific versions
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error listing models:', data.error);
            return;
        }

        console.log('Available Models:');
        const visionModels = [];
        for (const model of data.models) {
            console.log(`- ${model.name}`);
            if (model.supportedGenerationMethods.includes('generateContent')) {
                // Check if it supports vision (multimodal)
                // Ususally indicated by description or specific model families like gemini-1.5
                if (model.name.includes('gemini-1.5') || model.name.includes('vision')) {
                    visionModels.push(model.name);
                }
            }
        }

        console.log('\nPotential Vision Models:', visionModels);

    } catch (error) {
        console.error('Failed to list models:', error);
    }
}

listModels();
