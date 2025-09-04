"use client";
import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
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

  // Check if user is admin or coach
  if (userRole !== "admin" && userRole !== "coach") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            You don't have permission to access this page.
          </p>
        </div>
      </SecureComponent>
    );
  }

  if (loading) {
    return (
      <SecureComponent>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </SecureComponent>
    );
  }

  if (error) {
    return (
      <SecureComponent>
        <div className="min-h-screen bg-gray-50 p-6">
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
      </SecureComponent>
    );
  }

  return (
    <SecureComponent>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your fitness business performance and key metrics</p>
          <div className="text-sm text-gray-500 mt-1">
            Last updated: {dashboardData ? new Date().toLocaleString() : 'Never'}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard 
            title="Total Users"
            value={dashboardData?.summary?.totalUsers || 0}
            change={`+${dashboardData?.summary?.growthPercentage?.users || 0}%`}
            icon="fa-users"
            color="blue"
            subtitle={`${dashboardData?.summary?.uniqueClients || 0} clients, ${dashboardData?.summary?.totalInstructors || 0} instructors`}
          />
          <MetricsCard 
            title="Active Enrollments"
            value={dashboardData?.summary?.activeEnrollments || 0}
            change={`+${dashboardData?.summary?.growthPercentage?.enrollments || 0}%`}
            icon="fa-user-plus"
            color="green"
            subtitle={`${dashboardData?.summary?.completionRate || 0}% completion rate`}
          />
          <MetricsCard 
            title="Monthly Revenue"
            value={`₹${(dashboardData?.summary?.monthlyRevenue || 0).toLocaleString()}`}
            change={`+${dashboardData?.summary?.growthPercentage?.revenue || 0}%`}
            icon="fa-chart-pie"
            color="orange"
            subtitle="Current month earnings"
          />
          <MetricsCard 
            title="New Registrations"
            value={dashboardData?.summary?.newRegistrations || 0}
            change={`+${dashboardData?.summary?.growthPercentage?.registrations || 0}%`}
            icon="fa-user-check"
            color="purple"
            subtitle="Last 7 days"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={dashboardData?.charts?.revenueTrend || []} />
          <UserGrowthChart data={dashboardData?.charts?.userGrowthTrend || []} />
          <EnrollmentStatusChart data={dashboardData?.charts?.enrollmentStatus || []} />
          <InstructorPerformanceChart data={dashboardData?.topInstructors || []} />
        </div>

        {/* Top Instructors & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Instructors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Instructors</h3>
            <div className="space-y-4">
              {(dashboardData?.topInstructors || []).slice(0, 5).map((instructor, index) => (
                <div key={instructor.mentorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{instructor.mentorName}</p>
                      <p className="text-sm text-gray-500">{instructor.mentorEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{instructor.activeClients} clients</p>
                    <p className="text-sm text-green-600">₹{instructor.totalRevenue?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <ActivityFeed activities={dashboardData?.recentActivity || []} />
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatusBadge 
              label="Active" 
              count={dashboardData?.statusCounts?.active || 0} 
              color="green" 
            />
            <StatusBadge 
              label="Pending" 
              count={dashboardData?.statusCounts?.pending || 0} 
              color="yellow" 
            />
            <StatusBadge 
              label="Paid Pending" 
              count={dashboardData?.statusCounts?.paid_pending || 0} 
              color="blue" 
            />
            <StatusBadge 
              label="Completed" 
              count={dashboardData?.statusCounts?.completed || 0} 
              color="purple" 
            />
            <StatusBadge 
              label="Cancelled" 
              count={dashboardData?.statusCounts?.cancelled || 0} 
              color="red" 
            />
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

// Enhanced Metrics Card Component
const MetricsCard = ({ title, value, change, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-500',
    green: 'border-green-500 text-green-500', 
    orange: 'border-orange-500 text-orange-500',
    purple: 'border-purple-500 text-purple-500'
  };

  const borderColor = color === 'blue' ? 'border-blue-500' :
                     color === 'green' ? 'border-green-500' :
                     color === 'orange' ? 'border-orange-500' :
                     color === 'purple' ? 'border-purple-500' :
                     'border-blue-500';

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          <div className="mt-2">
            <p className="text-green-500 text-sm font-medium">{change} from last month</p>
            {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className={`text-3xl ${colorClasses[color] || 'text-blue-500'}`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
    </div>
  );
};

// Activity Feed Component
const ActivityFeed = ({ activities }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent activity</p>
      ) : (
        activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activity.type === 'enrollment' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <i className={`fas ${
                activity.type === 'enrollment' ? 'fa-user-plus text-blue-600' : 'fa-rupee-sign text-green-600'
              } text-sm`}></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{activity.title}</p>
              <p className="text-xs text-gray-500">
                {activity.timestamp ? 
                  new Date(activity.timestamp.seconds ? activity.timestamp.seconds * 1000 : activity.timestamp)
                    .toLocaleString() : 
                  'Unknown time'
                }
              </p>
              {activity.amount && (
                <p className="text-xs text-green-600 font-medium">₹{activity.amount.toLocaleString()}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ label, count, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800'
  };

  return (
    <div className={`${colorClasses[color]} px-3 py-2 rounded-lg text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export default DashboardOverview;