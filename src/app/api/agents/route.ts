import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'default-user';

        const agents = await db.aIAgent.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(agents);
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agents' },
            { status: 500 }
        );
    }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            description,
            type,
            provider,
            model,
            prompt,
            temperature,
            maxTokens,
            isActive,
            userId = 'default-user'
        } = body;

        // Validate required fields
        if (!name || !type || !provider || !model || !prompt) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const agent = await db.aIAgent.create({
            data: {
                userId,
                name,
                description,
                type,
                provider,
                model,
                prompt,
                temperature: parseFloat(temperature) || 0.3,
                maxTokens: parseInt(maxTokens) || 2000,
                isActive: isActive !== false,
            }
        });

        return NextResponse.json(agent, { status: 201 });
    } catch (error) {
        console.error('Error creating agent:', error);
        return NextResponse.json(
            { error: 'Failed to create agent' },
            { status: 500 }
        );
    }
}

// PUT /api/agents - Update agent
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            name,
            description,
            type,
            provider,
            model,
            prompt,
            temperature,
            maxTokens,
            isActive
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        const agent = await db.aIAgent.update({
            where: { id },
            data: {
                name,
                description,
                type,
                provider,
                model,
                prompt,
                temperature: temperature ? parseFloat(temperature) : undefined,
                maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
                isActive,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error updating agent:', error);
        return NextResponse.json(
            { error: 'Failed to update agent' },
            { status: 500 }
        );
    }
}

// DELETE /api/agents - Delete agent
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        await db.aIAgent.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting agent:', error);
        return NextResponse.json(
            { error: 'Failed to delete agent' },
            { status: 500 }
        );
    }
}
