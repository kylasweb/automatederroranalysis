import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/agents/[id] - Get specific agent
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const agent = await db.aIAgent.findUnique({
            where: { id: params.id }
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error fetching agent:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agent' },
            { status: 500 }
        );
    }
}

// PUT /api/agents/[id] - Update specific agent
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
            isActive
        } = body;

        const agent = await db.aIAgent.update({
            where: { id: params.id },
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

// DELETE /api/agents/[id] - Delete specific agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await db.aIAgent.delete({
            where: { id: params.id }
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

// PATCH /api/agents/[id] - Partial update (toggle status, increment usage, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        let updateData: any = { updatedAt: new Date() };

        switch (action) {
            case 'toggle':
                const currentAgent = await db.aIAgent.findUnique({
                    where: { id: params.id },
                    select: { isActive: true }
                });
                updateData.isActive = !currentAgent?.isActive;
                break;

            case 'incrementUsage':
                updateData.usageCount = { increment: 1 };
                updateData.lastUsed = new Date();
                break;

            case 'updateUsage':
                updateData.lastUsed = new Date();
                break;

            default:
                updateData = { ...data, updatedAt: new Date() };
                break;
        }

        const agent = await db.aIAgent.update({
            where: { id: params.id },
            data: updateData
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
