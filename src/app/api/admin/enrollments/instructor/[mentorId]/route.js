import { NextResponse } from 'next/server';
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";

export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { mentorId } = await params;

    if (!mentorId) {
      return NextResponse.json(
        { error: "Mentor ID is required" },
        { status: 400 }
      );
    }

    // Get enrollments for specific mentor
    const enrollmentsQuery = query(
      collection(db, "enrollments"),
      where("mentorIdCl", "==", mentorId)
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientIdCl: data.clientIdCl,
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
        acceptedAt: data.acceptedAt || null,
        endDate: data.endDate || null,
        status: data.status || 'pending',
        updatedAt: data.updatedAt || data.enrolledAt
      };
    });

    // Sort enrollments by date (newest first)
    enrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

    // Calculate enrollment statistics
    const stats = {
      total: enrollments.length,
      pending: enrollments.filter(e => e.status === 'pending').length,
      paid_pending: enrollments.filter(e => e.status === 'paid_pending').length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      cancelled: enrollments.filter(e => e.status === 'cancelled').length,
      totalRevenue: enrollments
        .filter(e => e.status === 'active' || e.status === 'completed' || e.status === 'paid_pending')
        .reduce((sum, e) => sum + (e.package?.rate || 0), 0),
      latestEnrollment: enrollments[0]?.enrolledAt || null
    };

    return NextResponse.json({
      success: true,
      enrollments,
      stats
    });

  } catch (error) {
    console.error("Error fetching instructor enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructor enrollments" },
      { status: 500 }
    );
  }
}