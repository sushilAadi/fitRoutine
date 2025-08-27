import { NextResponse } from 'next/server';
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";

export async function GET(request) {
  try {
    // Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 100;

    let enrollmentsQuery = query(collection(db, "enrollments"));

    // Filter by mentor if specified
    if (mentorId) {
      enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("mentorIdCl", "==", mentorId)
      );
    }

    // Filter by status if specified
    if (status && status !== 'all') {
      enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("status", "==", status)
      );
    }

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Return only necessary fields for security
      return {
        id: doc.id,
        mentorIdCl: data.mentorIdCl,
        mentorName: data.mentorName,
        mentorEmail: data.mentorEmail,
        mentorProfileImage: data.mentorProfileImage,
        clientIdCl: data.clientIdCl,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        package: {
          type: data.package?.type,
          rate: data.package?.rate,
          fullName: data.package?.fullName,
          phoneNumber: data.package?.phoneNumber,
          availability: data.package?.availability,
          trainingLocations: data.package?.trainingLocations,
          profileImage: data.package?.profileImage
        },
        clientDetails: data.clientDetails,
        enrolledAt: data.enrolledAt,
        status: data.status || 'pending',
        updatedAt: data.updatedAt || data.enrolledAt
      };
    });

    // Sort enrollments by date (newest first)
    enrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

    // Apply limit after sorting
    const limitedEnrollments = enrollments.slice(0, limit);

    // Get enrollment counts by status (use all enrollments, not limited)
    const statusCounts = {
      total: enrollments.length,
      pending: enrollments.filter(e => e.status === 'pending').length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      cancelled: enrollments.filter(e => e.status === 'cancelled').length
    };

    return NextResponse.json({
      success: true,
      enrollments: limitedEnrollments,
      statusCounts
    });

  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}