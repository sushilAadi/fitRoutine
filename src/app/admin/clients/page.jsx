"use client";
import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const ClientManagement = () => {
  const { user } = useContext(GlobalContext);
  const [clients, setClients] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientStats, setClientStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    successRate: 0
  });
  
  const userRole = user?.publicMetadata?.role;

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

  // Fetch all clients and enrollments data
  useEffect(() => {
    fetchClientsData();
  }, []);

  // Helper function to get mentor's active client count
  const getMentorActiveClients = (mentorId, allEnrollments) => {
    if (!mentorId) return 0;
    return allEnrollments.filter(e => 
      (e.mentorIdCl === mentorId || e.instructorId === mentorId) && 
      e.status === 'active'
    ).length;
  };

  // Helper function to get user role from Clerk metadata
  // Note: In a real implementation, you'd need to fetch this from Clerk API
  // using the clerkId: user?.publicMetadata?.role
  const getUserRole = (clerkId) => {
    // TODO: Implement Clerk API call to get user?.publicMetadata?.role
    // For now, falling back to Firebase role
    return null;
  };

  const fetchClientsData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL users from Firebase users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          // Basic Info
          name: userData.userName || userData.name || (userData.firstName && userData.lastName ? userData.firstName + ' ' + userData.lastName : userData.firstName || userData.lastName) || 'Unknown User',
          email: userData.userEmail || userData.email || '',
          phone: userData.phone || '',
          clerkId: userData.userIdCl || userData.clerkId || userData.id || doc.id,
          createdAt: userData.createdAt || userData.created_at || null,
          lastSignInAt: userData.lastSignInAt || userData.last_sign_in_at || null,
          
          // Health & Fitness Data
          gender: userData.userGender || null,
          birthDate: userData.userBirthDate || null,
          height: userData.userHeight || userData.latestHeight || null,
          weight: userData.userWeight || userData.latestWeight || null,
          activityLevel: userData.activityLevel || null,
          goals: userData.helpYou || null,
          lastMetricsUpdate: userData.lastMetricsUpdate || null,
          
          // System Data
          firebaseRole: userData.role || null,
          clerkRole: null, // Will be populated from Clerk metadata using user?.publicMetadata?.role
          enrollmentCount: 0,
          totalRevenue: 0,
          lastActivity: null,
          activeEnrollments: 0,
          completedPrograms: 0
        });
      });

      // Fetch all enrollments to supplement user data
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      const enrollmentsData = [];
      
      enrollmentsSnapshot.forEach((doc) => {
        const enrollmentData = doc.data();
        enrollmentsData.push({
          id: doc.id,
          ...enrollmentData
        });
      });

      // Fetch all payments data for accurate payment information
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const paymentsData = [];
      
      paymentsSnapshot.forEach((doc) => {
        const paymentData = doc.data();
        paymentsData.push({
          id: doc.id,
          ...paymentData
        });
      });
      
      // Debug logging
      console.log('Debug - Total users found:', allUsers.length);
      console.log('Debug - Total enrollments found:', enrollmentsData.length);
      console.log('Debug - Total payments found:', paymentsData.length);
      console.log('Debug - Sample user data:', allUsers.slice(0, 2));
      console.log('Debug - Sample payment data:', paymentsData.slice(0, 2));

      // Process ALL users with their enrollment information
      const processedUsers = allUsers.map(user => {
        const userEnrollments = enrollmentsData.filter(
          enrollment => enrollment.clientEmail === user.email || 
                      enrollment.clientIdCl === user.clerkId ||
                      enrollment.clientIdCl === user.id ||
                      enrollment.clientName === user.name
        );
        
        // Get actual payments made by this user from payments collection
        const userPayments = paymentsData.filter(
          payment => payment.userEmail === user.email || 
                    payment.userId === user.clerkId ||
                    payment.userId === user.id ||
                    payment.userName === user.name
        );
        
        // Calculate total amount paid by user from verified payments
        const totalPaid = userPayments
          .filter(payment => payment.status === 'verified')
          .reduce((sum, payment) => {
            return sum + (parseFloat(payment.amount) || 0);
          }, 0);
        
        const lastEnrollment = userEnrollments
          .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))[0];
        
        // Determine user status based on enrollment activity
        let userStatus = 'registered';
        if (userEnrollments.length === 0) {
          userStatus = 'registered';
        } else if (userEnrollments.some(e => e.status === 'active')) {
          userStatus = 'active';
        } else if (userEnrollments.some(e => e.status === 'completed')) {
          userStatus = 'completed';
        } else {
          userStatus = 'enrolled';
        }
        
        // Get current mentor info for display
        const currentEnrollment = userEnrollments.find(e => e.status === 'active') || lastEnrollment;
        const mentorId = currentEnrollment?.mentorIdCl || currentEnrollment?.instructorId;
        const mentorActiveClients = getMentorActiveClients(mentorId, enrollmentsData);
        
        return {
          ...user,
          enrollmentCount: userEnrollments.length,
          totalPaid, // Changed from totalRevenue
          lastActivity: lastEnrollment?.enrolledAt || user.createdAt,
          completedPrograms: userEnrollments.filter(e => e.status === 'completed').length,
          activeEnrollments: userEnrollments.filter(e => e.status === 'active').length,
          status: userStatus,
          enrollments: userEnrollments, // Store enrollments for modal
          payments: userPayments, // Store payments for modal
          currentMentor: currentEnrollment?.mentorName || currentEnrollment?.instructorName || null,
          currentMentorId: mentorId,
          mentorActiveClients: mentorActiveClients
        };
      });

      setClients(processedUsers);
      setEnrollments(enrollmentsData);
      
      // Calculate stats - now including all users
      const stats = {
        totalClients: processedUsers.length,
        activeClients: processedUsers.filter(u => u.activeEnrollments > 0).length,
        totalPaid: processedUsers.reduce((sum, user) => sum + user.totalPaid, 0), // Changed from totalRevenue
        successRate: processedUsers.filter(u => u.enrollmentCount > 0).length > 0 
          ? Math.round((processedUsers.reduce((sum, user) => sum + user.completedPrograms, 0) / 
             processedUsers.reduce((sum, user) => sum + user.enrollmentCount, 0)) * 100) || 0
          : 0
      };
      
      setClientStats(stats);
      
    } catch (error) {
      console.error('Error fetching clients data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  const filteredUsers = clients.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'enrollments':
        return b.enrollmentCount - a.enrollmentCount;
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'lastActivity':
        return new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0);
      default:
        return 0;
    }
  });

  const getStatusBadge = (user) => {
    switch (user.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-500">Completed</Badge>;
      case 'enrolled':
        return <Badge variant="secondary">Enrolled</Badge>;
      case 'registered':
      default:
        return <Badge variant="outline">Registered</Badge>;
    }
  };
  
  const getRoleBadge = (user) => {
    // Get role from Clerk metadata (publicMetadata.role) - this is the correct source
    const role = user.clerkRole || user.firebaseRole || 'user';
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-red-500">Admin</Badge>;
      case 'instructor':
      case 'coach':
        return <Badge variant="default" className="bg-purple-500">Instructor</Badge>;
      case 'user':
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SecureComponent>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Complete user directory with roles, profiles, and enrollment analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <i className="fas fa-users text-blue-500 text-xl"></i>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800">{clientStats.totalClients}</div>
                <div className="text-xs text-gray-500 mt-1">All registered users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
                <i className="fas fa-user-check text-green-500 text-xl"></i>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{clientStats.activeClients}</div>
                <div className="text-xs text-gray-500 mt-1">Currently enrolled</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
                <i className="fas fa-money-bill-wave text-orange-500 text-xl"></i>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{formatCurrency(clientStats.totalPaid)}</div>
                <div className="text-xs text-gray-500 mt-1">Paid to instructors</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                <i className="fas fa-trophy text-purple-500 text-xl"></i>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{clientStats.successRate}%</div>
                <div className="text-xs text-gray-500 mt-1">Completion rate</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <Input
                  placeholder="Search clients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Enrolled</option>
                  <option value="completed">Completed</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="registered">Registered Only</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="enrollments">Sort by Enrollments</option>
                  <option value="revenue">Sort by Revenue</option>
                  <option value="lastActivity">Sort by Last Activity</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fetchClientsData()}>
                  <i className="fas fa-refresh mr-2"></i>
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory ({filteredUsers.length} users)</CardTitle>
            <CardDescription>Complete list of all registered users with roles and enrollment data</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-gray-600">Loading users...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Health Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mentor/Enrollments</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <i className={`fas ${user.gender === 'Male' ? 'fa-mars' : user.gender === 'Female' ? 'fa-venus' : 'fa-user'} text-blue-600`}></i>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{user.name || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-400">{user.phone}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {user.height && user.weight && (
                                <div className="text-sm font-medium">
                                  {user.height}cm • {user.weight}kg
                                </div>
                              )}
                              {user.gender && (
                                <div className="text-xs text-gray-500">{user.gender}</div>
                              )}
                              {user.birthDate && (
                                <div className="text-xs text-gray-400">
                                  Age: {new Date().getFullYear() - new Date(user.birthDate).getFullYear()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {user.currentMentor ? (
                                <div>
                                  <div className="font-semibold text-blue-600 text-sm">
                                    👨‍💼 {user.currentMentor}
                                  </div>
                                  <div className="text-xs text-blue-500">
                                    {user.mentorActiveClients} active clients
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No active mentor</div>
                              )}
                              <div className="text-xs text-gray-600 mt-1">
                                {user.enrollmentCount} enrollments: {user.activeEnrollments} active • {user.completedPrograms} completed
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(user.totalPaid)}
                            </span>
                            <div className="text-xs text-gray-500">
                              Paid to instructors
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedClient(user);
                                  setShowClientModal(true);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
                
                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {showClientModal && selectedClient && (
          <UserDetailModal 
            user={selectedClient} 
            enrollments={selectedClient.enrollments || []}
            payments={selectedClient.payments || []}
            onClose={() => {
              setShowClientModal(false);
              setSelectedClient(null);
            }}
          />
        )}
      </div>
    </SecureComponent>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, enrollments, payments, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-blue-600 text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown User'}</h2>
                <p className="text-gray-600">{user.email}</p>
                {user.phone && <p className="text-gray-500">{user.phone}</p>}
                <div className="mt-2 flex gap-2">
                  {user.firebaseRole && (
                    <Badge variant="default" className="bg-purple-500">
                      {user.firebaseRole}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {user.status}
                  </Badge>
                  {user.gender && (
                    <Badge variant="outline">
                      {user.gender}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* User Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{enrollments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}
                </div>
                <div className="text-xs text-gray-500 mt-1">Paid to instructors</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {enrollments.length > 0 
                    ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">BMI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {user.height && user.weight 
                    ? Math.round((user.weight / Math.pow(user.height/100, 2)) * 10) / 10
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health & Fitness Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Health Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Age</div>
                    <div className="font-semibold">
                      {user.birthDate 
                        ? new Date().getFullYear() - new Date(user.birthDate).getFullYear() + ' years'
                        : 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Gender</div>
                    <div className="font-semibold">{user.gender || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Height</div>
                    <div className="font-semibold">{user.height ? user.height + ' cm' : 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Weight</div>
                    <div className="font-semibold">{user.weight ? user.weight + ' kg' : 'Not provided'}</div>
                  </div>
                </div>
                
                {user.lastMetricsUpdate && (
                  <div>
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="font-semibold">{formatDate(user.lastMetricsUpdate)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fitness Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.activityLevel && (
                  <div>
                    <div className="text-sm text-gray-500">Activity Level</div>
                    <div className="font-semibold">{user.activityLevel.id || 'Not set'}</div>
                    <div className="text-sm text-gray-600">
                      {user.activityLevel.subtitle || ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      Factor: {user.activityLevel.factor || 'N/A'}
                    </div>
                  </div>
                )}
                
                {user.goals && (
                  <div>
                    <div className="text-sm text-gray-500">Goals</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.goals.split(',').map((goal, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {goal.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            {payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            Payment ID: {payment.razorpayPaymentId || payment.id}
                          </div>
                          <div className="text-sm text-gray-600">
                            Order ID: {payment.razorpayOrderId || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Transaction: {payment.transactionId || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Paid: {formatDate(payment.timestamp || payment.verifiedAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-orange-600 text-lg">
                            {formatCurrency(parseFloat(payment.amount) || 0)}
                          </div>
                          <Badge 
                            variant={payment.status === 'verified' ? 'default' : 'outline'}
                            className={payment.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}
                          >
                            {payment.status || 'pending'}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {payment.currency || 'INR'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-credit-card text-4xl text-gray-300 mb-4"></i>
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No payment history</h4>
                <p className="text-gray-500">This user hasn't made any payments yet.</p>
              </div>
            )}
          </div>

          {/* Enrollment History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment History</h3>
            {enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {enrollment.instructorName || 'Unknown Instructor'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Program: {enrollment.programName || enrollment.program || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Enrolled: {formatDate(enrollment.enrolledAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(parseFloat(enrollment.amount) || 0)}
                          </div>
                          <Badge 
                            variant={enrollment.status === 'completed' ? 'default' : 
                                   enrollment.status === 'active' ? 'secondary' : 'outline'}
                            className={enrollment.status === 'completed' ? 'bg-green-500' :
                                     enrollment.status === 'active' ? 'bg-blue-500' : ''}
                          >
                            {enrollment.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-history text-4xl text-gray-300 mb-4"></i>
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No enrollment history</h4>
                <p className="text-gray-500">This user hasn't enrolled in any programs yet.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientManagement;