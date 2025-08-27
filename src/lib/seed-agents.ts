import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAgents() {
    console.log('🤖 Seeding AI Agents...');

    // First, ensure we have an admin user
    let adminUser = await prisma.user.findFirst({
        where: { email: 'admin@example.com' }
    });

    if (!adminUser) {
        console.log('Creating admin user for agents...');
        adminUser = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin',
                role: 'ADMIN'
            }
        });
    }

    // Create sample AI agents
    const agents = [
        {
            userId: adminUser.id,
            name: 'Log Analyzer Pro',
            description: 'Advanced log analysis agent that specializes in identifying error patterns and root causes in application logs.',
            type: 'analyzer',
            provider: 'groq',
            model: 'llama-3.1-70b-versatile',
            prompt: 'You are an expert log analysis agent. Analyze the provided logs and identify errors, patterns, and potential root causes. Focus on critical issues that need immediate attention.',
            temperature: 0.3,
            maxTokens: 2000,
            isActive: true
        },
        {
            userId: adminUser.id,
            name: 'Performance Monitor',
            description: 'Specialized agent for detecting performance bottlenecks and resource utilization issues in system logs.',
            type: 'classifier',
            provider: 'openai',
            model: 'gpt-4o-mini',
            prompt: 'You are a performance monitoring specialist. Analyze logs for performance issues, resource bottlenecks, and optimization opportunities. Provide actionable insights.',
            temperature: 0.2,
            maxTokens: 1500,
            isActive: true
        },
        {
            userId: adminUser.id,
            name: 'Security Scanner',
            description: 'Security-focused agent that identifies potential security threats, unauthorized access attempts, and vulnerabilities.',
            type: 'classifier',
            provider: 'huggingface',
            model: 'microsoft/DialoGPT-medium',
            prompt: 'You are a cybersecurity expert. Scan logs for security threats, unauthorized access attempts, and potential vulnerabilities. Flag critical security issues.',
            temperature: 0.1,
            maxTokens: 1800,
            isActive: true
        },
        {
            userId: adminUser.id,
            name: 'Database Troubleshooter',
            description: 'Database-specific agent that focuses on SQL errors, connection issues, and database performance problems.',
            type: 'analyzer',
            provider: 'mistral',
            model: 'mistral-7b-instruct',
            prompt: 'You are a database expert. Analyze logs for SQL errors, connection issues, performance problems, and database-related anomalies. Suggest fixes.',
            temperature: 0.3,
            maxTokens: 2000,
            isActive: true
        },
        {
            userId: adminUser.id,
            name: 'Network Diagnostician',
            description: 'Network-focused agent for identifying connectivity issues, DNS problems, and network-related errors.',
            type: 'predictor',
            provider: 'together',
            model: 'meta-llama/Llama-3-8b-chat-hf',
            prompt: 'You are a network specialist. Examine logs for network connectivity issues, DNS problems, routing errors, and communication failures. Provide network diagnostics.',
            temperature: 0.3,
            maxTokens: 1500,
            isActive: false
        },
        {
            userId: adminUser.id,
            name: 'API Monitor',
            description: 'API-focused agent that monitors REST API calls, response times, and integration issues.',
            type: 'summarizer',
            provider: 'cohere',
            model: 'command-light',
            prompt: 'You are an API monitoring expert. Analyze API logs for errors, performance issues, authentication problems, and integration failures. Focus on critical API issues.',
            temperature: 0.2,
            maxTokens: 1600,
            isActive: true
        }
    ];

    for (const agent of agents) {
        const existingAgent = await prisma.aIAgent.findFirst({
            where: { name: agent.name }
        });

        if (!existingAgent) {
            await prisma.aIAgent.create({
                data: agent
            });
            console.log(`✅ Created agent: ${agent.name}`);
        } else {
            console.log(`⏭️  Agent already exists: ${agent.name}`);
        }
    }

    console.log('🎉 AI Agents seeding completed!');
}

async function main() {
    try {
        await seedAgents();
    } catch (error) {
        console.error('❌ Error seeding agents:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

export { seedAgents };
