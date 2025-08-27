import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface AIServiceStatus {
  name: string;
  status: 'available' | 'unavailable' | 'error';
  capabilities: string[];
  responseTime?: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const services: AIServiceStatus[] = [];
    
    // Test ZAI SDK availability
    try {
      const startTime = Date.now();
      const zai = await ZAI.create();
      
      // Test basic chat completion
      const testResponse = await zai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ],
        max_tokens: 10
      });
      
      const responseTime = Date.now() - startTime;
      
      if (testResponse.choices && testResponse.choices.length > 0) {
        services.push({
          name: 'ZAI SDK',
          status: 'available',
          capabilities: [
            'Chat Completions',
            'Image Generation',
            'Web Search',
            'Multiple AI Agents (Grok, Gemini, OpenAI)',
            'Log Analysis',
            'Error Detection',
            'Contextual Analysis'
          ],
          responseTime
        });
      } else {
        services.push({
          name: 'ZAI SDK',
          status: 'error',
          capabilities: [],
          error: 'Invalid response format'
        });
      }
    } catch (error) {
      services.push({
        name: 'ZAI SDK',
        status: 'unavailable',
        capabilities: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check for additional AI services (if configured)
    const aiServices = [
      {
        name: 'OpenAI GPT-4',
        envKey: 'OPENAI_API_KEY',
        capabilities: ['Advanced Reasoning', 'Code Generation', 'Complex Analysis']
      },
      {
        name: 'Anthropic Claude',
        envKey: 'ANTHROPIC_API_KEY',
        capabilities: ['Long Context', 'Safety-focused', 'Creative Writing']
      },
      {
        name: 'Google Gemini',
        envKey: 'GOOGLE_AI_API_KEY',
        capabilities: ['Multimodal', 'Google Integration', 'Fast Processing']
      }
    ];

    for (const service of aiServices) {
      const apiKey = process.env[service.envKey];
      
      if (apiKey) {
        services.push({
          name: service.name,
          status: 'available',
          capabilities: service.capabilities
        });
      } else {
        services.push({
          name: service.name,
          status: 'unavailable',
          capabilities: [],
          error: `API key not configured (${service.envKey})`
        });
      }
    }

    return NextResponse.json({
      services,
      summary: {
        total: services.length,
        available: services.filter(s => s.status === 'available').length,
        unavailable: services.filter(s => s.status === 'unavailable').length,
        errors: services.filter(s => s.status === 'error').length
      }
    });

  } catch (error) {
    console.error('Error checking AI service status:', error);
    return NextResponse.json(
      { error: 'Failed to check AI service status' },
      { status: 500 }
    );
  }
}