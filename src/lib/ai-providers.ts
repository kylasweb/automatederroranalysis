// AI Provider Service - Supports multiple AI providers including free ones
import { db } from './db';
import { getEdgeConfig, getAIProviderConfig } from './edge-config';

export interface AIProviderConfig {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface AIAnalysisRequest {
    prompt: string;
    context?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface AIAnalysisResponse {
    content: string;
    provider: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

class AIProviderService {
    private async getProviderConfig(provider?: string): Promise<AIProviderConfig> {
        try {
            // Get AI settings from database first
            const settings = await db.systemSetting.findMany({
                where: {
                    key: {
                        startsWith: 'ai_'
                    }
                }
            });

            const config: any = {};
            settings.forEach(setting => {
                config[setting.key] = setting.value;
            });

            // If database is empty or missing, fallback to Edge Config
            if (Object.keys(config).length === 0) {
                console.log('Database settings empty, using Edge Config...');
                const edgeConfigData = await getAIProviderConfig();
                const activeProvider = provider || edgeConfigData.primaryProvider || 'groq';

                return {
                    provider: activeProvider,
                    apiKey: edgeConfigData.providers[activeProvider]?.apiKey || '',
                    model: edgeConfigData.providers[activeProvider]?.model || this.getDefaultModel(activeProvider),
                    baseUrl: this.getDefaultBaseUrl(activeProvider),
                    temperature: edgeConfigData.temperature || 0.3,
                    maxTokens: edgeConfigData.maxTokens || 2000,
                    timeout: edgeConfigData.timeout || 30000,
                };
            }

            const activeProvider = provider || config.ai_provider || 'groq';

            return {
                provider: activeProvider,
                apiKey: config[`${activeProvider}_api_key`] || '',
                model: config[`${activeProvider}_model`] || this.getDefaultModel(activeProvider),
                baseUrl: config[`${activeProvider}_base_url`] || this.getDefaultBaseUrl(activeProvider),
                temperature: config.ai_temperature || 0.3,
                maxTokens: config.ai_max_tokens || 2000,
                timeout: config.ai_timeout || 30000,
            };
        } catch (error) {
            console.error('Error getting provider config:', error);
            // Ultimate fallback to environment variables
            const activeProvider = provider || 'groq';
            return {
                provider: activeProvider,
                apiKey: process.env[`${activeProvider.toUpperCase()}_API_KEY`] || '',
                model: this.getDefaultModel(activeProvider),
                baseUrl: this.getDefaultBaseUrl(activeProvider),
                temperature: 0.3,
                maxTokens: 2000,
                timeout: 30000,
            };
        }
    }

    private getDefaultModel(provider: string): string {
        const defaultModels: Record<string, string> = {
            'groq': 'llama-3.1-70b-versatile',
            'openai': 'gpt-4o-mini',
            'huggingface': 'microsoft/DialoGPT-medium',
            'openrouter': 'meta-llama/llama-3.1-8b-instruct:free',
            'together': 'meta-llama/Llama-3-8b-chat-hf',
            'mistral': 'mistral-7b-instruct',
            'cohere': 'command-light',
            'z.ai': 'gpt-4o-mini',
        };
        return defaultModels[provider] || 'llama-3.1-70b-versatile';
    }

    private getDefaultBaseUrl(provider: string): string {
        const baseUrls: Record<string, string> = {
            'groq': 'https://api.groq.com/openai/v1',
            'openai': 'https://api.openai.com/v1',
            'huggingface': 'https://api-inference.huggingface.co/models',
            'openrouter': 'https://openrouter.ai/api/v1',
            'together': 'https://api.together.xyz/v1',
            'mistral': 'https://api.mistral.ai/v1',
            'cohere': 'https://api.cohere.ai/v1',
            'z.ai': 'https://api.z.ai',
        };
        return baseUrls[provider] || 'https://api.groq.com/openai/v1';
    }

    async analyzeWithAI(request: AIAnalysisRequest, provider?: string): Promise<AIAnalysisResponse> {
        const config = await this.getProviderConfig(provider);

        if (!config.apiKey) {
            throw new Error(`API key not configured for provider: ${config.provider}`);
        }

        switch (config.provider) {
            case 'groq':
                return this.callGroqAPI(request, config);
            case 'openai':
                return this.callOpenAIAPI(request, config);
            case 'huggingface':
                return this.callHuggingFaceAPI(request, config);
            case 'openrouter':
                return this.callOpenRouterAPI(request, config);
            case 'together':
                return this.callTogetherAPI(request, config);
            case 'mistral':
                return this.callMistralAPI(request, config);
            case 'cohere':
                return this.callCohereAPI(request, config);
            case 'z.ai':
                return this.callZAIAPI(request, config);
            default:
                throw new Error(`Unsupported AI provider: ${config.provider}`);
        }
    }

    private async callGroqAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software engineer analyzing error logs and system issues. Provide detailed technical analysis.'
                    },
                    {
                        role: 'user',
                        content: request.prompt + (request.context ? `\n\nContext: ${request.context}` : '')
                    }
                ],
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || 'No response from AI',
            provider: 'groq',
            model: config.model,
            usage: data.usage,
        };
    }

    private async callOpenAIAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software engineer analyzing error logs and system issues. Provide detailed technical analysis.'
                    },
                    {
                        role: 'user',
                        content: request.prompt + (request.context ? `\n\nContext: ${request.context}` : '')
                    }
                ],
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || 'No response from AI',
            provider: 'openai',
            model: config.model,
            usage: data.usage,
        };
    }

    private async callHuggingFaceAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/${config.model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: request.prompt + (request.context ? `\n\nContext: ${request.context}` : ''),
                parameters: {
                    temperature: request.temperature || config.temperature,
                    max_new_tokens: request.maxTokens || config.maxTokens,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data[0]?.generated_text || 'No response from AI',
            provider: 'huggingface',
            model: config.model,
        };
    }

    private async callOpenRouterAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://your-app.com',
                'X-Title': 'LogAllot',
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software engineer analyzing error logs and system issues. Provide detailed technical analysis.'
                    },
                    {
                        role: 'user',
                        content: request.prompt + (request.context ? `\n\nContext: ${request.context}` : '')
                    }
                ],
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || 'No response from AI',
            provider: 'openrouter',
            model: config.model,
            usage: data.usage,
        };
    }

    private async callTogetherAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software engineer analyzing error logs and system issues. Provide detailed technical analysis.'
                    },
                    {
                        role: 'user',
                        content: request.prompt + (request.context ? `\n\nContext: ${request.context}` : '')
                    }
                ],
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`Together AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || 'No response from AI',
            provider: 'together',
            model: config.model,
            usage: data.usage,
        };
    }

    private async callMistralAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software engineer analyzing error logs and system issues. Provide detailed technical analysis.'
                    },
                    {
                        role: 'user',
                        content: request.prompt + (request.context ? `\n\nContext: ${request.context}` : '')
                    }
                ],
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`Mistral AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || 'No response from AI',
            provider: 'mistral',
            model: config.model,
            usage: data.usage,
        };
    }

    private async callCohereAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        const response = await fetch(`${config.baseUrl}/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.model,
                prompt: request.prompt + (request.context ? `\n\nContext: ${request.context}` : ''),
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.generations[0]?.text || 'No response from AI',
            provider: 'cohere',
            model: config.model,
        };
    }

    private async callZAIAPI(request: AIAnalysisRequest, config: AIProviderConfig): Promise<AIAnalysisResponse> {
        // Use the existing Z.ai SDK implementation
        try {
            const ZAI = (await import('z-ai-web-dev-sdk')).default;
            const zai = await ZAI.create();

            const response = await zai.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software engineer analyzing error logs and system issues. Provide detailed technical analysis.'
                    },
                    {
                        role: 'user',
                        content: request.prompt + (request.context ? `\n\nContext: ${request.context}` : '')
                    }
                ],
                temperature: request.temperature || config.temperature,
                max_tokens: request.maxTokens || config.maxTokens,
            });

            return {
                content: response.choices[0]?.message?.content || 'No response from AI',
                provider: 'z.ai',
                model: config.model,
            };
        } catch (error) {
            throw new Error(`Z.ai API error: ${error}`);
        }
    }

    async testConnection(provider: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await this.analyzeWithAI({
                prompt: 'Test connection. Please respond with "Connection successful".',
                maxTokens: 50,
            }, provider);

            return {
                success: true,
                message: `Connection successful. Provider: ${response.provider}, Model: ${response.model}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}

export const aiProviderService = new AIProviderService();
