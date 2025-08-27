import { createClient } from '@vercel/edge-config';

// Initialize Edge Config client
export const edgeConfig = createClient(process.env.EDGE_CONFIG);

// Helper function to get configuration values
export async function getEdgeConfig(key: string, fallback?: any) {
    try {
        if (!process.env.EDGE_CONFIG) {
            console.warn('EDGE_CONFIG environment variable not set, using fallback value');
            return fallback;
        }

        const value = await edgeConfig.get(key);
        return value !== undefined ? value : fallback;
    } catch (error) {
        console.error(`Failed to get edge config for key "${key}":`, error);
        return fallback;
    }
}

// Helper function to get all configuration values
export async function getAllEdgeConfig() {
    try {
        if (!process.env.EDGE_CONFIG) {
            console.warn('EDGE_CONFIG environment variable not set');
            return {};
        }

        const config = await edgeConfig.getAll();
        return config;
    } catch (error) {
        console.error('Failed to get all edge config:', error);
        return {};
    }
}

// Helper function to check if a feature is enabled
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
    try {
        const enabled = await getEdgeConfig(`features.${featureName}`, false);
        return Boolean(enabled);
    } catch (error) {
        console.error(`Failed to check feature "${featureName}":`, error);
        return false;
    }
}

// Helper function to get AI provider configuration from Edge Config
export async function getAIProviderConfig() {
    try {
        const config = await getAllEdgeConfig();
        return {
            primaryProvider: config['ai.primaryProvider'] || 'groq',
            providers: {
                groq: {
                    apiKey: config['ai.groq.apiKey'] || process.env.GROQ_API_KEY,
                    model: config['ai.groq.model'] || 'llama-3.1-70b-versatile'
                },
                openai: {
                    apiKey: config['ai.openai.apiKey'] || process.env.OPENAI_API_KEY,
                    model: config['ai.openai.model'] || 'gpt-4o-mini'
                },
                huggingface: {
                    apiKey: config['ai.huggingface.apiKey'] || process.env.HUGGINGFACE_API_KEY,
                    model: config['ai.huggingface.model'] || 'microsoft/DialoGPT-medium'
                }
            },
            timeout: config['ai.timeout'] || 30000,
            maxTokens: config['ai.maxTokens'] || 2000,
            temperature: config['ai.temperature'] || 0.3
        };
    } catch (error) {
        console.error('Failed to get AI provider config:', error);
        return {
            primaryProvider: 'groq',
            providers: {},
            timeout: 30000,
            maxTokens: 2000,
            temperature: 0.3
        };
    }
}
