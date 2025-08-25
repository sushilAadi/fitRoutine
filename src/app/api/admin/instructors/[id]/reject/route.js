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
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectedBy: user.id
    });

    // Log the action for audit trail
    logAdminAction("REJECT_INSTRUCTOR", user.id, {
      instructorId,
      instructorEmail: instructor.email,
      instructorName: instructor.name
    });

    return NextResponse.json({
      success: true,
      message: "Instructor rejected successfully",
      instructorId
    });

  } catch (error) {
    console.error("Error rejecting instructor:", error);
    return NextResponse.json(
      { error: "Failed to reject instructor" },
      { status: 500 }
    );
  }
}