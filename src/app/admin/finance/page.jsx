"use client";
import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const FinancialReports = () => {
  const { user } = useContext(GlobalContext);
  const userRole = user?.publicMetadata?.role;

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentorPayments, setMentorPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  
  // Financial metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingMentorPayments: 0,
    completedTransactions: 0,
    activeEnrollments: 0,
    expiredEnrollments: 0
  });

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    paymentMode: 'UPI',
    upiId: '',
    accountDetails: '',
    amount: 0,
    notes: ''
  });

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

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // Load enrollments
      const enrollmentsSnapshot = await getDocs(
        query(collection(db, 'enrollments'), orderBy('enrolledAt', 'desc'))
      );
      const enrollmentsData = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        endDate: new Date(doc.data().endDate),
        enrolledAt: new Date(doc.data().enrolledAt),
        acceptedAt: doc.data().acceptedAt ? new Date(doc.data().acceptedAt) : null
      }));
      setEnrollments(enrollmentsData);

      // Load payments
      const paymentsSnapshot = await getDocs(
        query(collection(db, 'payments'), orderBy('timestamp', 'desc'))
      );
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp)
      }));
      setPayments(paymentsData);

      // Load mentors
      const mentorsSnapshot = await getDocs(
        query(collection(db, 'mentors'), where('status', '==', 'approved'))
      );
      const mentorsData = mentorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMentors(mentorsData);

      // Load mentor payments
      const mentorPaymentsSnapshot = await getDocs(
        query(collection(db, 'mentorPayments'), orderBy('createdAt', 'desc'))
      );
      const mentorPaymentsData = mentorPaymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
      }));
      setMentorPayments(mentorPaymentsData);

      // Calculate pending payments and metrics
      calculatePendingPayments(enrollmentsData, mentorPaymentsData);
      calculateMetrics(enrollmentsData, paymentsData, mentorPaymentsData);

    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePendingPayments = (enrollments, mentorPayments) => {
    const pending = [];
    const currentDate = new Date();

    enrollments.forEach(enrollment => {
      if (enrollment.status === 'active' && enrollment.endDate <= currentDate) {
        // Check if payment already made for this enrollment
        const existingPayment = mentorPayments.find(mp => 
          mp.enrollmentId === enrollment.id && mp.status === 'completed'
        );

        if (!existingPayment) {
          // Calculate monthly payments for long-term plans
          const enrollmentStart = enrollment.acceptedAt || enrollment.enrolledAt;
          const monthsCompleted = Math.floor((currentDate - enrollmentStart) / (1000 * 60 * 60 * 24 * 30));
          
          // Find mentor details
          const mentor = mentors.find(m => m.userIdCl === enrollment.mentorIdCl);
          
          pending.push({
            id: enrollment.id,
            type: enrollment.endDate <= currentDate ? 'completion' : 'monthly',
            enrollmentId: enrollment.id,
            clientName: enrollment.clientName,
            clientEmail: enrollment.clientEmail,
            mentorName: enrollment.mentorName,
            mentorId: enrollment.mentorIdCl,
            mentorEmail: enrollment.mentorEmail,
            amount: enrollment.paymentDetails?.amount || 0,
            dueDate: enrollment.endDate,
            monthsCompleted,
            status: 'pending',
            mentor: mentor
          });
        }
      }
    });

    setPendingPayments(pending);
  };

  const calculateMetrics = (enrollments, payments, mentorPayments) => {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const totalRevenue = payments
      .filter(p => p.status === 'verified')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthlyRevenue = payments
      .filter(p => p.status === 'verified' && new Date(p.timestamp) >= currentMonth)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingMentorPayments = mentorPayments
      .filter(mp => mp.status === 'pending')
      .reduce((sum, mp) => sum + (mp.amount || 0), 0);

    const activeEnrollments = enrollments.filter(e => 
      e.status === 'active' && e.endDate > currentDate
    ).length;

    const expiredEnrollments = enrollments.filter(e => 
      e.status === 'active' && e.endDate <= currentDate
    ).length;

    setMetrics({
      totalRevenue,
      monthlyRevenue,
      pendingMentorPayments,
      completedTransactions: payments.filter(p => p.status === 'verified').length,
      activeEnrollments,
      expiredEnrollments
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedPayment || !paymentForm.transactionId) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Create mentor payment record
      const mentorPaymentData = {
        enrollmentId: selectedPayment.enrollmentId,
        mentorId: selectedPayment.mentorId,
        mentorEmail: selectedPayment.mentorEmail,
        mentorName: selectedPayment.mentorName,
        clientName: selectedPayment.clientName,
        clientEmail: selectedPayment.clientEmail,
        amount: paymentForm.amount || selectedPayment.amount,
        transactionId: paymentForm.transactionId,
        paymentMode: paymentForm.paymentMode,
        upiId: paymentForm.upiId,
        accountDetails: paymentForm.accountDetails,
        notes: paymentForm.notes,
        status: 'completed',
        createdAt: serverTimestamp(),
        processedBy: user?.id,
        type: selectedPayment.type
      };

      await addDoc(collection(db, 'mentorPayments'), mentorPaymentData);

      // Update enrollment status if it's a completion payment
      if (selectedPayment.type === 'completion') {
        await updateDoc(doc(db, 'enrollments', selectedPayment.enrollmentId), {
          paymentStatus: 'mentor_paid',
          paidToMentorAt: serverTimestamp()
        });
      }

      toast.success('Payment processed successfully');
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentForm({
        transactionId: '',
        paymentMode: 'UPI',
        upiId: '',
        accountDetails: '',
        amount: 0,
        notes: ''
      });
      
      loadFinancialData(); // Refresh data
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const getMentorName = (mentorId) => {
    const mentor = mentors.find(m => m.userIdCl === mentorId);
    return mentor?.name || 'Unknown Mentor';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const calculateMonthlyCommission = (enrollment, mentor) => {
    if (!mentor) return enrollment.paymentDetails?.amount || 0;
    
    const totalAmount = enrollment.paymentDetails?.amount || 0;
    // Assuming 80% goes to mentor, 20% to admin (adjust as needed)
    return Math.floor(totalAmount * 0.8);
  };

  if (loading) {
    return (
      <SecureComponent>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading financial data...</p>
            </div>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Financial Reports</h1>
          <p className="text-gray-600">Mentor payments, commission tracking, and revenue analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: 'fa-chart-pie' },
              { id: 'pending-payments', name: 'Pending Payments', icon: 'fa-clock' },
              { id: 'payment-history', name: 'Payment History', icon: 'fa-history' },
              { id: 'revenue-analytics', name: 'Revenue Analytics', icon: 'fa-chart-line' },
              { id: 'mentor-commissions', name: 'Mentor Commissions', icon: 'fa-user-friends' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:text-green-500 hover:bg-green-50'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
                  </div>
                  <i className="fas fa-rupee-sign text-3xl text-green-500"></i>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.monthlyRevenue)}</p>
                  </div>
                  <i className="fas fa-calendar text-3xl text-blue-500"></i>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending Mentor Payments</p>
                    <p className="text-3xl font-bold text-orange-600">{pendingPayments.length}</p>
                  </div>
                  <i className="fas fa-clock text-3xl text-orange-500"></i>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Expired Enrollments</p>
                    <p className="text-3xl font-bold text-red-600">{metrics.expiredEnrollments}</p>
                  </div>
                  <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Financial Activity</h3>
              <div className="space-y-4">
                {payments.slice(0, 5).map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{payment.userName}</h4>
                      <p className="text-sm text-gray-600">{payment.userEmail}</p>
                      <p className="text-sm text-gray-500">
                        {payment.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Pending Payments Tab */}
        {activeTab === 'pending-payments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Pending Mentor Payments</h3>
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <span className="text-orange-800 font-medium">
                  {pendingPayments.length} payments pending
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {pendingPayments.map(payment => (
                <Card key={payment.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{payment.mentorName}</h4>
                          <p className="text-sm text-gray-600">{payment.mentorEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            payment.type === 'completion' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {payment.type === 'completion' ? 'Enrollment Completed' : 'Monthly Payment'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="font-medium">{payment.clientName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-medium">{payment.dueDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(calculateMonthlyCommission({ paymentDetails: { amount: payment.amount } }, payment.mentor))}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <Button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setPaymentForm({
                            ...paymentForm,
                            amount: calculateMonthlyCommission({ paymentDetails: { amount: payment.amount } }, payment.mentor)
                          });
                          setShowPaymentModal(true);
                        }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <i className="fas fa-credit-card mr-2"></i>
                        Process Payment
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {pendingPayments.length === 0 && (
                <Card className="p-8 text-center">
                  <i className="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500">No pending mentor payments at this time.</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'payment-history' && (
          <PaymentHistory mentorPayments={mentorPayments} formatCurrency={formatCurrency} />
        )}

        {/* Revenue Analytics Tab */}
        {activeTab === 'revenue-analytics' && (
          <RevenueAnalytics payments={payments} enrollments={enrollments} formatCurrency={formatCurrency} />
        )}

        {/* Mentor Commissions Tab */}
        {activeTab === 'mentor-commissions' && (
          <MentorCommissions mentors={mentors} mentorPayments={mentorPayments} enrollments={enrollments} formatCurrency={formatCurrency} />
        )}

        {/* Payment Processing Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Process Payment to Mentor</h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedPayment.mentorName}</p>
                  <p className="text-sm text-gray-600">{selectedPayment.mentorEmail}</p>
                  <p className="text-sm text-gray-600">Client: {selectedPayment.clientName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount to Pay</label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})}
                    placeholder="Amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentMode: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {paymentForm.paymentMode === 'UPI' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">UPI ID</label>
                    <Input
                      value={paymentForm.upiId}
                      onChange={(e) => setPaymentForm({...paymentForm, upiId: e.target.value})}
                      placeholder="mentor@upi"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Transaction ID *</label>
                  <Input
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                    placeholder="Enter transaction ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Account Details</label>
                  <textarea
                    value={paymentForm.accountDetails}
                    onChange={(e) => setPaymentForm({...paymentForm, accountDetails: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Bank account or UPI details"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleProcessPayment} className="bg-green-500 hover:bg-green-600">
                    Process Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SecureComponent>
  );
};

// Payment History Component
const PaymentHistory = ({ mentorPayments, formatCurrency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayments = mentorPayments.filter(payment => {
    const matchesSearch = payment.mentorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by mentor, client, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredPayments.map(payment => (
          <Card key={payment.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{payment.mentorName}</h4>
                <p className="text-sm text-gray-600">Client: {payment.clientName}</p>
                <p className="text-sm text-gray-600">Transaction: {payment.transactionId}</p>
                <p className="text-sm text-gray-500">
                  {payment.createdAt ? payment.createdAt.toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.status}
                </span>
                <p className="text-sm text-gray-500 mt-1">{payment.paymentMode}</p>
              </div>
            </div>
          </Card>
        ))}

        {filteredPayments.length === 0 && (
          <Card className="p-8 text-center">
            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No payment records found</p>
          </Card>
        )}
      </div>
    </div>
  );
};

// Revenue Analytics Component
const RevenueAnalytics = ({ payments, enrollments, formatCurrency }) => {
  const [timeRange, setTimeRange] = useState('month');
  
  const calculateRevenueByPeriod = () => {
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return payments
      .filter(p => p.status === 'verified' && new Date(p.timestamp) >= startDate)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const revenue = calculateRevenueByPeriod();
  const totalTransactions = payments.filter(p => p.status === 'verified').length;
  const averageTransaction = totalTransactions > 0 ? payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + (p.amount || 0), 0) / totalTransactions : 0;

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600">Revenue ({timeRange})</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600">Total Transactions</h3>
          <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600">Average Transaction</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(averageTransaction)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
        <div className="space-y-4">
          {['card', 'upi', 'wallet'].map(method => {
            const methodPayments = payments.filter(p => p.status === 'verified');
            const count = methodPayments.length;
            const amount = methodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            return (
              <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium capitalize">{method}</h4>
                  <p className="text-sm text-gray-600">{count} transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(amount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// Mentor Commissions Component
const MentorCommissions = ({ mentors, mentorPayments, enrollments, formatCurrency }) => {
  const calculateMentorStats = (mentor) => {
    const mentorEnrollments = enrollments.filter(e => e.mentorIdCl === mentor.userIdCl);
    const mentorPaymentRecords = mentorPayments.filter(mp => mp.mentorId === mentor.userIdCl);
    
    const totalEarned = mentorPaymentRecords
      .filter(mp => mp.status === 'completed')
      .reduce((sum, mp) => sum + (mp.amount || 0), 0);
    
    const pendingAmount = mentorPaymentRecords
      .filter(mp => mp.status === 'pending')
      .reduce((sum, mp) => sum + (mp.amount || 0), 0);

    return {
      totalEnrollments: mentorEnrollments.length,
      totalEarned,
      pendingAmount,
      activeEnrollments: mentorEnrollments.filter(e => e.status === 'active').length
    };
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map(mentor => {
          const stats = calculateMentorStats(mentor);
          return (
            <Card key={mentor.id} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={mentor.profileImage || "https://www.aiscribbles.com/img/variant/large-preview/43289/?v=cbd7a5"}
                  alt={mentor.name}
                  className="w-12 h-12 rounded-full border"
                />
                <div>
                  <h3 className="font-semibold">{mentor.name}</h3>
                  <p className="text-sm text-gray-600">{mentor.email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Earned:</span>
                  <span className="font-bold text-green-600">{formatCurrency(stats.totalEarned)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="font-bold text-orange-600">{formatCurrency(stats.pendingAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Clients:</span>
                  <span className="font-bold text-blue-600">{stats.activeEnrollments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Enrollments:</span>
                  <span className="font-bold text-gray-600">{stats.totalEnrollments}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialReports;