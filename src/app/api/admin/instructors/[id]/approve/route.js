import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth, logAdminAction } from "@/lib/auth/adminAuth";

export async function POST(request, { params }) {
  try {
    // Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const instructorId = params.id;

    if (!instructorId) {
      return NextResponse.json(
        { error: "Instructor ID is required" },
        { status: 400 }
      );
    }

    // Get instructor data first
    const instructorRef = doc(db, "Mentor", instructorId);
    const instructorSnap = await getDoc(instructorRef);

    if (!instructorSnap.exists()) {
      return NextResponse.json(
        { error: "Instructor not found" },
        { status: 404 }
      );
    }

    const instructor = instructorSnap.data();

    // Update Firestore status
    await updateDoc(instructorRef, {
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: user.id
    });

    // Update user role in Clerk if userIdCl exists
    if (instructor.userIdCl) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/admin/update-user-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: instructor.userIdCl, 
            role: 'coach' 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user role in Clerk');
        }
      } catch (roleError) {
        console.error('Error updating user role:', roleError);
        // Revert Firestore update if Clerk update fails
        await updateDoc(instructorRef, {
          status: "pending",
          approvedAt: null,
          approvedBy: null
        });
        
        return NextResponse.json(
          { error: "Failed to update user role. Please try again." },
          { status: 500 }
        );
      }
    }

    // Log the action for audit trail
    logAdminAction("APPROVE_INSTRUCTOR", user.id, {
      instructorId,
      instructorEmail: instructor.email,
      instructorName: instructor.name
    });

    return NextResponse.json({
      success: true,
      message: "Instructor approved successfully",
      instructorId
    });

  } catch (error) {
    console.error("Error approving instructor:", error);
    return NextResponse.json(
      { error: "Failed to approve instructor" },
      { status: 500 }
    );
  }
}