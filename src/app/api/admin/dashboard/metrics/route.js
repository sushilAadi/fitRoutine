import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { verifyAdminAuth, logAdminAction } from "@/lib/auth/adminAuth";

export async function GET(request) {
  try {
    // Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7'; // default 7 days

    // Calculate date range for filtering
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - parseInt(timeRange));

    // Get total users from multiple collections
    const [mentorsSnapshot, enrollmentsSnapshot, paymentsSnapshot] = await Promise.all([
      getDocs(collection(db, "Mentor")),
      getDocs(collection(db, "enrollments")), 
      getDocs(collection(db, "payments"))
    ]);

    // Process enrollments data
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate metrics
    const totalInstructors = mentorsSnapshot.size;
    
    // Get unique clients from enrollments
    const uniqueClients = new Set(enrollments.map(e => e.clientIdCl)).size;
    const totalUsers = totalInstructors + uniqueClients;

    // Active enrollments
    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    
    // Calculate enrollment completion rate
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const totalCompletedOrActive = activeEnrollments + completedEnrollments;
    const completionRate = totalCompletedOrActive > 0 ? Math.round((completedEnrollments / totalCompletedOrActive) * 100) : 0;

    // Monthly revenue (current month)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = payments
      .filter(payment => {
        if (!payment.timestamp) return false;
        const paymentDate = payment.timestamp.toDate ? payment.timestamp.toDate() : new Date(payment.timestamp);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               payment.status === 'verified';
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // New registrations (last 7 days)
    const newRegistrations = enrollments.filter(enrollment => {
      if (!enrollment.enrolledAt) return false;
      const enrolledDate = enrollment.enrolledAt.toDate ? 
        enrollment.enrolledAt.toDate() : 
        new Date(enrollment.enrolledAt);
      return enrolledDate >= pastDate;
    }).length;

    // Top instructors by active clients
    const instructorStats = {};
    enrollments
      .filter(e => e.status === 'active')
      .forEach(enrollment => {
        const mentorId = enrollment.mentorIdCl;
        if (!instructorStats[mentorId]) {
          instructorStats[mentorId] = {
            mentorId,
            mentorName: enrollment.mentorName || 'Unknown',
            mentorEmail: enrollment.mentorEmail,
            activeClients: 0,
            totalRevenue: 0
          };
        }
        instructorStats[mentorId].activeClients++;
      });

    // Add revenue to instructor stats
    payments
      .filter(p => p.status === 'verified')
      .forEach(payment => {
        // Find enrollment for this payment to get mentor
        const enrollment = enrollments.find(e => e.clientIdCl === payment.userId);
        if (enrollment && instructorStats[enrollment.mentorIdCl]) {
          instructorStats[enrollment.mentorIdCl].totalRevenue += payment.amount || 0;
        }
      });

    const topInstructors = Object.values(instructorStats)
      .sort((a, b) => b.activeClients - a.activeClients)
      .slice(0, 5);

    // Revenue trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthRevenue = payments
        .filter(payment => {
          if (!payment.timestamp) return false;
          const paymentDate = payment.timestamp.toDate ? payment.timestamp.toDate() : new Date(payment.timestamp);
          return paymentDate.getMonth() === month && 
                 paymentDate.getFullYear() === year &&
                 payment.status === 'verified';
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      revenueTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    // Enrollment status distribution
    const statusCounts = {
      active: enrollments.filter(e => e.status === 'active').length,
      pending: enrollments.filter(e => e.status === 'pending').length,
      paid_pending: enrollments.filter(e => e.status === 'paid_pending').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      cancelled: enrollments.filter(e => e.status === 'cancelled').length,
      total: enrollments.length
    };

    // User growth trend (last 6 months)
    const userGrowthTrend = [];
    let cumulativeUsers = 0;
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // First day of month
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthEnrollments = enrollments.filter(enrollment => {
        if (!enrollment.enrolledAt) return false;
        const enrolledDate = enrollment.enrolledAt.toDate ? 
          enrollment.enrolledAt.toDate() : 
          new Date(enrollment.enrolledAt);
        return enrolledDate <= endOfMonth;
      }).length;

      const monthInstructors = mentorsSnapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.createdAt) return true; // Include if no date
        const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        return createdDate <= endOfMonth;
      }).length;

      userGrowthTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        users: monthEnrollments + monthInstructors
      });
    }

    // Recent activity (last 10 items)
    const recentEnrollments = enrollments
      .filter(e => e.enrolledAt)
      .sort((a, b) => {
        const dateA = a.enrolledAt.toDate ? a.enrolledAt.toDate() : new Date(a.enrolledAt);
        const dateB = b.enrolledAt.toDate ? b.enrolledAt.toDate() : new Date(b.enrolledAt);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(enrollment => ({
        type: 'enrollment',
        title: `${enrollment.clientName} enrolled with ${enrollment.mentorName}`,
        timestamp: enrollment.enrolledAt,
        status: enrollment.status,
        amount: enrollment.package?.rate
      }));

    const recentPayments = payments
      .filter(p => p.timestamp && p.status === 'verified')
      .sort((a, b) => {
        const dateA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(payment => ({
        type: 'payment',
        title: `Payment received: ₹${payment.amount?.toLocaleString()}`,
        timestamp: payment.timestamp,
        amount: payment.amount
      }));

    const recentActivity = [...recentEnrollments, ...recentPayments]
      .sort((a, b) => {
        const dateA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB - dateA;
      })
      .slice(0, 10);

    // Log admin action
    logAdminAction("GET_DASHBOARD_METRICS", user.id, {
      totalUsers,
      activeEnrollments,
      monthlyRevenue
    });

    const dashboardMetrics = {
      summary: {
        totalUsers,
        totalInstructors,
        uniqueClients,
        activeEnrollments,
        monthlyRevenue,
        newRegistrations,
        completionRate: completionRate,
        growthPercentage: {
          users: 12, // Calculate based on previous period
          enrollments: 8,
          revenue: 15,
          registrations: 5
        }
      },
      charts: {
        revenueTrend,
        userGrowthTrend,
        enrollmentStatus: [
          { name: 'Active', value: statusCounts.active },
          { name: 'Pending', value: statusCounts.pending },
          { name: 'Paid Pending', value: statusCounts.paid_pending },
          { name: 'Completed', value: statusCounts.completed },
          { name: 'Cancelled', value: statusCounts.cancelled }
        ]
      },
      topInstructors,
      recentActivity,
      statusCounts
    };

    return NextResponse.json({
      success: true,
      data: dashboardMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics", details: error.message },
      { status: 500 }
    );
  }
}