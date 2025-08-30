// AI Provider Service - Supports multiple AI providers including free ones
import { db } from './db';
import { getEdgeConfig, getAIProviderConfig } from './edge-config';
// Lazy import for alert manager to avoid circular dependencies
import type { RealTimeAlertManager } from './alerts';

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

// Generic retry helper with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, baseDelay = 300): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            if (attempt > retries) throw err;
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

// Redact long tokens and obvious API keys before including text in alerts/logs
function redactSensitive(s: string, maxLen = 200) {
    if (!s) return s;
    // Replace long continuous alphanumeric tokens (likely API keys or tokens)
    const redacted = s.replace(/(?:[A-Za-z0-9_-]{20,})/g, '[REDACTED]');
    // Truncate to avoid sending very long content
    return redacted.length > maxLen ? redacted.slice(0, maxLen) + '...[TRUNCATED]' : redacted;
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
                const edgeConfigData: any = await getAIProviderConfig();
                const activeProvider = provider || edgeConfigData.primaryProvider || 'groq';

                return {
                    provider: String(activeProvider),
                    apiKey: (edgeConfigData.providers as any)[activeProvider]?.apiKey || '',
                    model: (edgeConfigData.providers as any)[activeProvider]?.model || this.getDefaultModel(String(activeProvider)),
                    baseUrl: this.getDefaultBaseUrl(String(activeProvider)),
                    temperature: (edgeConfigData.temperature as any) || 0.3,
                    maxTokens: (edgeConfigData.maxTokens as any) || 2000,
                    timeout: (edgeConfigData.timeout as any) || 30000,
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
        try {
            const callFn = async () => {
                switch (config.provider) {
                    case 'groq':
                        return await this.callGroqAPI(request, config);
                    case 'openai':
                        return await this.callOpenAIAPI(request, config);
                    case 'huggingface':
                        return await this.callHuggingFaceAPI(request, config);
                    case 'openrouter':
                        return await this.callOpenRouterAPI(request, config);
                    case 'together':
                        return await this.callTogetherAPI(request, config);
                    case 'mistral':
                        return await this.callMistralAPI(request, config);
                    case 'cohere':
                        return await this.callCohereAPI(request, config);
                    case 'z.ai':
                        return await this.callZAIAPI(request, config);
                    default:
                        throw new Error(`Unsupported AI provider: ${config.provider}`);
                }
            };

            // Retry with exponential backoff on transient failures
            return await retryWithBackoff(() => callFn(), 3, 300);
        } catch (error: any) {
            // Notify system admins of provider failure if alert manager exists
            try {
                const alertsModule = await import('./alerts');
                const alertMgr = alertsModule.getAlertManager ? alertsModule.getAlertManager() : null;
                if (alertMgr) {
                    const truncatedPrompt = redactSensitive(request.prompt || '');
                    const payload = {
                        type: 'AI_PROVIDER_FAILURE',
                        provider: config.provider,
                        operation: 'analyzeWithAI',
                        prompt: truncatedPrompt,
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: new Date().toISOString(),
                        retries: 3,
                        requestId: (Math.random() + 1).toString(36).substring(2, 10),
                    };
                    alertMgr.sendSystemAlert(JSON.stringify(payload));
                }
            } catch (e) {
                console.error('Failed to send provider failure system alert:', e);
            }

            throw error;
        }
    }

    // Test a provider key without altering runtime config
    async testApiKey(provider: string, apiKey: string): Promise<{ success: boolean; message: string }> {
        try {
            const cfg = await this.getProviderConfig(provider);
            const tempCfg = { ...cfg, apiKey };

            // perform a lightweight call depending on provider
            switch (provider) {
                case 'groq':
                    await this.callGroqAPI({ prompt: 'Test connection. Please respond with "Connection successful".', maxTokens: 10 }, tempCfg);
                    break;
                case 'openai':
                    await this.callOpenAIAPI({ prompt: 'Test connection. Please respond with "Connection successful".', maxTokens: 10 }, tempCfg);
                    break;
                default:
                    // Generic test via analyzeWithAI
                    await this.analyzeWithAI({ prompt: 'Test connection. Please respond with "Connection successful".', maxTokens: 10 }, provider);
            }

            return { success: true, message: 'Connection successful' };
        } catch (error: any) {
            // Send a system alert about provider failure if alert manager is available
            try {
                const alertsModule = await import('./alerts');
                const alertMgr: RealTimeAlertManager | null = (alertsModule && alertsModule.getAlertManager) ? alertsModule.getAlertManager() : null;
                if (alertMgr) {
                    const payload = {
                        type: 'AI_PROVIDER_TEST_FAILURE',
                        provider,
                        operation: 'testApiKey',
                        // Don't include raw apiKey; redact any incidental text
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: new Date().toISOString(),
                        requestId: (Math.random() + 1).toString(36).substring(2, 10),
                    };
                    alertMgr.sendSystemAlert(JSON.stringify(payload));
                }
            } catch (e) {
                // ignore alerting failures
                console.error('Failed to send provider failure alert:', e);
            }

            return { success: false, message: error instanceof Error ? error.message : String(error) };
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
