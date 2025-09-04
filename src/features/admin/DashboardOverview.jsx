"use client";
import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import { 
  RevenueChart, 
  UserGrowthChart, 
  EnrollmentStatusChart,
  InstructorPerformanceChart 
} from "@/components/admin/DashboardCharts";
import toast from "react-hot-toast";

const DashboardOverview = () => {
  const { user } = useContext(GlobalContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = user?.publicMetadata?.role;

  // Fetch real dashboard data from Firebase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/dashboard/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          throw new Error(result.error || 'Failed to load dashboard data');
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (userRole === "admin" || userRole === "coach") {
      fetchDashboardData();
    }
  }, [userRole]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-6 max-w-full">
        {/* 2025 Minimalist Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Overview</h1>
              <p className="text-gray-600">Monitor your fitness business performance and key metrics</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </div>
              <div className="text-sm text-gray-500">
                Updated {dashboardData ? new Date().toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* 2025 Metrics Cards - Clean & Modern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard2025 
            title="Total Users"
            value={dashboardData?.summary?.totalUsers || 0}
            change={`+${dashboardData?.summary?.growthPercentage?.users || 0}%`}
            icon="fa-users"
            color="blue"
            subtitle={`${dashboardData?.summary?.uniqueClients || 0} clients, ${dashboardData?.summary?.totalInstructors || 0} instructors`}
          />
          <MetricsCard2025 
            title="Active Enrollments"
            value={dashboardData?.summary?.activeEnrollments || 0}
            change={`+${dashboardData?.summary?.growthPercentage?.enrollments || 0}%`}
            icon="fa-user-plus"
            color="green"
            subtitle={`${dashboardData?.summary?.completionRate || 0}% completion rate`}
          />
          <MetricsCard2025 
            title="Monthly Revenue"
            value={`₹${(dashboardData?.summary?.monthlyRevenue || 0).toLocaleString()}`}
            change={`+${dashboardData?.summary?.growthPercentage?.revenue || 0}%`}
            icon="fa-chart-pie"
            color="orange"
            subtitle="Current month earnings"
          />
          <MetricsCard2025 
            title="New Registrations"
            value={dashboardData?.summary?.newRegistrations || 0}
            change={`+${dashboardData?.summary?.growthPercentage?.registrations || 0}%`}
            icon="fa-user-check"
            color="purple"
            subtitle="Last 7 days"
          />
        </div>

        {/* 2025 Charts Section - Clean Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={dashboardData?.charts?.revenueTrend || []} />
          <UserGrowthChart data={dashboardData?.charts?.userGrowthTrend || []} />
          <EnrollmentStatusChart data={dashboardData?.charts?.enrollmentStatus || []} />
          <InstructorPerformanceChart data={dashboardData?.topInstructors || []} />
        </div>

        {/* 2025 Layout - Top Instructors & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Instructors - 2025 Design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Instructors</h3>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                Top 5
              </span>
            </div>
            <div className="space-y-3">
              {(dashboardData?.topInstructors || []).slice(0, 5).map((instructor, index) => (
                <div key={instructor.mentorId} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:border-gray-200 hover:bg-gray-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{instructor.mentorName}</p>
                      <p className="text-xs text-gray-500">{instructor.mentorEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{instructor.activeClients} clients</p>
                    <p className="text-xs text-green-600">₹{instructor.totalRevenue?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed - 2025 Design */}
          <ActivityFeed2025 activities={dashboardData?.recentActivity || []} />
        </div>

        {/* 2025 Status Overview - Clean & Simple */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">All Systems Operational</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatusCard2025 
              label="Active" 
              count={dashboardData?.statusCounts?.active || 0} 
              color="green"
            />
            <StatusCard2025 
              label="Pending" 
              count={dashboardData?.statusCounts?.pending || 0} 
              color="yellow"
            />
            <StatusCard2025 
              label="Paid Pending" 
              count={dashboardData?.statusCounts?.paid_pending || 0} 
              color="blue"
            />
            <StatusCard2025 
              label="Completed" 
              count={dashboardData?.statusCounts?.completed || 0} 
              color="purple"
            />
            <StatusCard2025 
              label="Cancelled" 
              count={dashboardData?.statusCounts?.cancelled || 0} 
              color="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 2025 Metrics Card - Clean & Modern
const MetricsCard2025 = ({ title, value, change, icon, color, subtitle }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'bg-green-500', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' }
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${styles.icon}`}>
          <i className={`fas ${icon} text-white text-lg`}></i>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-1">
          <span className="text-green-600 text-sm font-semibold">{change}</span>
          <span className="text-gray-500 text-sm">from last month</span>
        </div>
        {subtitle && (
          <p className="text-gray-500 text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

// 2025 Activity Feed - Clean Design
const ActivityFeed2025 = ({ activities }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
        Live Feed
      </span>
    </div>
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-history text-2xl text-gray-300 mb-2"></i>
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-50 hover:border-gray-200 hover:bg-gray-50 transition-all">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activity.type === 'enrollment' ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              <i className={`fas ${
                activity.type === 'enrollment' ? 'fa-user-plus' : 'fa-rupee-sign'
              } text-white text-sm`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm mb-1">{activity.title}</p>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>
                  {activity.timestamp ? 
                    new Date(activity.timestamp.seconds ? activity.timestamp.seconds * 1000 : activity.timestamp)
                      .toLocaleString() : 
                    'Unknown time'
                  }
                </span>
                {activity.amount && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                    ₹{activity.amount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// 2025 Status Card - Minimal & Clean
const StatusCard2025 = ({ label, count, color }) => {
  const colorClasses = {
    green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    yellow: { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    red: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 text-center hover:shadow-sm transition-shadow`}>
      <p className="text-2xl font-bold text-gray-900 mb-1">{count}</p>
      <p className={`text-sm font-medium ${styles.text}`}>{label}</p>
    </div>
  );
};

export default DashboardOverview;