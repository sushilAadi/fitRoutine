"use client";
import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';

// Custom colors for your fitness brand
const COLORS = {
  primary: '#007BFF',
  success: '#28a745', 
  warning: '#ffc107',
  danger: '#dc3545',
  orange: '#fd7e14'
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.orange, COLORS.danger, COLORS.warning];

// Revenue Area Chart with Gradient
export const RevenueChart = ({ data = [] }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Revenue Trend</h3>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          stroke="#666"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#666"
          tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
        />
        <Tooltip 
          formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
          labelStyle={{ color: '#333' }}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={COLORS.primary}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#revenueGradient)"
          animationBegin={0}
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// User Growth Line Chart
export const UserGrowthChart = ({ data = [] }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">User Growth</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          stroke="#666"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#666"
        />
        <Tooltip 
          formatter={(value, name) => [value, name === 'users' ? 'Total Users' : name]}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        />
        <Line
          type="monotone"
          dataKey="users"
          stroke={COLORS.success}
          strokeWidth={3}
          dot={{ fill: COLORS.success, r: 6 }}
          activeDot={{ r: 8, fill: COLORS.success }}
          animationBegin={0}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Enrollment Status Pie Chart
export const EnrollmentStatusChart = ({ data = [] }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Enrollment Status Distribution</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          animationBegin={0}
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [value, 'Enrollments']}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span style={{ color: '#333' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

// Instructor Performance Bar Chart
export const InstructorPerformanceChart = ({ data = [] }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Performing Instructors</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          type="number" 
          tick={{ fontSize: 12 }}
          stroke="#666"
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          stroke="#666"
          width={100}
        />
        <Tooltip 
          formatter={(value) => [value, 'Active Clients']}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        />
        <Bar
          dataKey="clients"
          fill={COLORS.orange}
          radius={[0, 4, 4, 0]}
          animationBegin={0}
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Combined Dashboard Charts Component
export const DashboardCharts = () => {
  // Sample data - replace with real data from Firebase
  const revenueData = [
    { month: 'Jan', revenue: 65000 },
    { month: 'Feb', revenue: 72000 },
    { month: 'Mar', revenue: 85000 },
    { month: 'Apr', revenue: 92000 },
    { month: 'May', revenue: 105000 },
    { month: 'Jun', revenue: 125000 }
  ];

  const userGrowthData = [
    { month: 'Jan', users: 150 },
    { month: 'Feb', users: 180 },
    { month: 'Mar', users: 220 },
    { month: 'Apr', users: 280 },
    { month: 'May', users: 350 },
    { month: 'Jun', users: 425 }
  ];

  const enrollmentStatusData = [
    { name: 'Active', value: 145 },
    { name: 'Pending', value: 23 },
    { name: 'Cancelled', value: 12 },
    { name: 'Completed', value: 89 }
  ];

  const instructorPerformanceData = [
    { name: 'Rahul S.', clients: 28 },
    { name: 'Priya P.', clients: 25 },
    { name: 'Amit K.', clients: 22 },
    { name: 'Sneha S.', clients: 20 },
    { name: 'Vikram J.', clients: 18 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RevenueChart data={revenueData} />
      <UserGrowthChart data={userGrowthData} />
      <EnrollmentStatusChart data={enrollmentStatusData} />
      <InstructorPerformanceChart data={instructorPerformanceData} />
    </div>
  );
};

export default DashboardCharts;