import { NextResponse } from 'next/server';
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth, logAdminAction } from "@/lib/auth/adminAuth";

export async function GET(request) {
  try {
    // Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    // Get all instructors from Firestore
    const mentorsRef = collection(db, "Mentor");
    const snapshot = await getDocs(mentorsRef);
    
    const instructors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Log the action for audit trail
    logAdminAction("GET_ALL_INSTRUCTORS", user.id, {
      instructorCount: instructors.length
    });

    return NextResponse.json({
      success: true,
      instructors,
      count: instructors.length
    });

  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 }
    );
  }
}