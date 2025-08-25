import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Verify admin authentication and authorization
 * @param {Request} request - The request object
 * @returns {Promise<{user: Object, error: NextResponse|null}>}
 */
export async function verifyAdminAuth(request) {
  try {
    // Get auth from request context
    const { userId } = await auth();
    
    // Check if user is authenticated
    if (!userId) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      };
    }

    // Get user details to verify role
    const user = await clerkClient.users.getUser(userId);
    const userRole = user.publicMetadata?.role;
    
    // Check if user has admin or coach permissions
    if (userRole !== "admin" && userRole !== "coach") {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Forbidden - Admin or Coach access required" },
          { status: 403 }
        )
      };
    }

    return {
      user: {
        id: userId,
        role: userRole,
        clerkUser: user
      },
      error: null
    };
  } catch (error) {
    console.error("Admin auth verification failed:", error);
    return {
      user: null,
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    };
  }
}

/**
 * Log admin actions for audit trail
 * @param {string} action - Action performed
 * @param {string} userId - User ID performing the action
 * @param {Object} details - Additional details
 */
export function logAdminAction(action, userId, details = {}) {
  console.log(`[ADMIN_AUDIT] ${new Date().toISOString()} - User: ${userId}, Action: ${action}`, {
    ...details,
    timestamp: new Date().toISOString(),
    userId,
    action
  });
}