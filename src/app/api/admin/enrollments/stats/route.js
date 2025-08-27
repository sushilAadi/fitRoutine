import { NextResponse } from 'next/server';
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";

export async function GET(request) {
  try {
    // Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    // Get all enrollments
    const enrollmentsSnapshot = await getDocs(collection(db, "enrollments"));
    
    const mentorStats = {};
    let totalEnrollments = 0;
    
    enrollmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const mentorId = data.mentorIdCl;
      
      if (!mentorStats[mentorId]) {
        mentorStats[mentorId] = {
          mentorId,
          mentorName: data.mentorName,
          total: 0,
          pending: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
          latestEnrollment: null
        };
      }
      
      mentorStats[mentorId].total++;
      totalEnrollments++;
      
      const status = data.status || 'pending';
      if (mentorStats[mentorId][status] !== undefined) {
        mentorStats[mentorId][status]++;
      }
      
      // Track latest enrollment
      const enrolledAt = data.enrolledAt;
      if (!mentorStats[mentorId].latestEnrollment || enrolledAt > mentorStats[mentorId].latestEnrollment) {
        mentorStats[mentorId].latestEnrollment = enrolledAt;
      }
    });

    return NextResponse.json({
      success: true,
      totalEnrollments,
      mentorStats: Object.values(mentorStats)
    });

  } catch (error) {
    console.error("Error fetching enrollment stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment stats" },
      { status: 500 }
    );
  }
}