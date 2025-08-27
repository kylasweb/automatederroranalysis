import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { analyses: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const transformedUser = {
      ...user,
      analysesCount: user._count.analyses
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { email, name, role } = await request.json();
    
    // Find the user first
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Store old values for audit log
    const oldValues = {
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role
    };

    // Update user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        ...(email && { email }),
        ...(name !== undefined && { name }),
        ...(role && { role })
      },
      include: {
        _count: {
          select: { analyses: true }
        }
      }
    });

    // Log the user update
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: params.id,
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify({ email, name, role }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    const transformedUser = {
      ...updatedUser,
      analysesCount: updatedUser._count.analyses
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store user data for audit log
    const userData = {
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id: params.id }
    });

    // Log the user deletion
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'User',
        entityId: params.id,
        oldValues: JSON.stringify(userData),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}