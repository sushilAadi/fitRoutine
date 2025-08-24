import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    // Check if user is authenticated and is admin
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user details to verify admin or coach role
    const currentUser = await clerkClient.users.getUser(currentUserId);
    const currentUserRole = currentUser.publicMetadata?.role;

    if (currentUserRole !== 'admin' && currentUserRole !== 'coach') {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Coach access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['user', 'coach', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: user, coach, admin' },
        { status: 400 }
      );
    }

    // Update user's public metadata with new role
    const updatedUser = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      userId: userId,
      newRole: role
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}