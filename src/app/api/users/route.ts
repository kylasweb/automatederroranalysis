import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let users;
    if (search) {
      users = await db.user.findMany({
        where: {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } }
          ]
        },
        include: {
          _count: {
            select: { analyses: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      users = await db.user.findMany({
        include: {
          _count: {
            select: { analyses: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Transform the data to include analysesCount
    const transformedUsers = users.map(user => ({
      ...user,
      analysesCount: user._count.analyses
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        email,
        name,
        role: role || 'USER'
      },
      include: {
        _count: {
          select: { analyses: true }
        }
      }
    });

    // Log the user creation
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'User',
        entityId: newUser.id,
        newValues: JSON.stringify({ email, name, role }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    const transformedUser = {
      ...newUser,
      analysesCount: newUser._count.analyses
    };

    return NextResponse.json(transformedUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}