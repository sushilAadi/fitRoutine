import { NextResponse } from 'next/server';
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth, logAdminAction } from "@/lib/auth/adminAuth";

export async function DELETE(request, { params }) {
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

    // Reset user role to 'user' in Clerk if they were approved
    if (instructor.userIdCl && instructor.status === "approved") {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/admin/update-user-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: instructor.userIdCl, 
            role: 'user' 
          }),
        });

        if (!response.ok) {
          console.error('Failed to reset user role in Clerk');
          return NextResponse.json(
            { error: "Failed to reset user role. Please try again." },
            { status: 500 }
          );
        }
      } catch (roleError) {
        console.error('Error resetting user role:', roleError);
        return NextResponse.json(
          { error: "Failed to reset user role. Please try again." },
          { status: 500 }
        );
      }
    }

    // Delete from Firestore
    await deleteDoc(instructorRef);

    // Log the action for audit trail
    logAdminAction("DELETE_INSTRUCTOR", user.id, {
      instructorId,
      instructorEmail: instructor.email,
      instructorName: instructor.name,
      previousStatus: instructor.status
    });

    return NextResponse.json({
      success: true,
      message: "Instructor deleted successfully",
      instructorId
    });

  } catch (error) {
    console.error("Error deleting instructor:", error);
    return NextResponse.json(
      { error: "Failed to delete instructor" },
      { status: 500 }
    );
  }
}