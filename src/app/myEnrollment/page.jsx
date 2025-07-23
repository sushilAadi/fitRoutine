"use client";
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import { db } from "@/firebase/firebaseConfig";
import EnrollmentStatus from '@/components/EnrollmentStatus';
import MyEnrollmentCard from '@/components/Card/MyEnrollmentCard';
import { format } from 'date-fns';

const MyEnrollment = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userDetailData, handleOpenClose } = useContext(GlobalContext);

  const calculateEndDate = useCallback((enrollment) => {
    
    if (!enrollment?.acceptedAt || !enrollment?.package) return null;

    const startDate = new Date(enrollment.acceptedAt);
    const packageType = enrollment.package.type;
    
    if (packageType === 'hourly') {
      const minutes = parseInt(enrollment.package.rate) || 0;
      return new Date(startDate.getTime() + minutes * 60000);
    }
    
    const packageDays = {
      monthly: 30,
      quarterly: 90,
      halfYearly: 180,
      yearly: 365
    }[packageType] || 0;
    
    const endDate = new Date(startDate);
    
    endDate.setDate(endDate.getDate() + packageDays);
    return endDate;
  }, []);

  const formatDateTime = useCallback((dateString, isHourly = false) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isHourly) {
      return format(date, 'dd-MM-yyyy (hh:mm a)');
    }
    
    return format(date, 'dd-MM-yyyy');
  }, []);

  const checkAndUpdateStatus = useCallback(async (enrollmentData) => {
    if (!enrollmentData || enrollmentData.status === 'pending' || enrollmentData.status === 'rejected') {
      return enrollmentData;
    }
  
    const endDate = calculateEndDate(enrollmentData);
    
    if (!endDate) return enrollmentData;
  
    // Get current date without time
    const currentDate = new Date();
    
  
    // Get end date without time
    const normalizedEndDate = new Date(endDate);
    
  
    
    // Compare the normalized dates
    const newStatus = currentDate > normalizedEndDate ? 'completed' : 'active';
    

    
    if (newStatus !== enrollmentData.status) {
      try {
        const enrollmentRef = doc(db, 'enrollments', enrollmentData.id);
        
        await updateDoc(enrollmentRef, { status: newStatus });
        return { ...enrollmentData, status: newStatus };
      } catch (error) {
        return enrollmentData;
      }
    }
  
    return enrollmentData;
  }, [calculateEndDate]);

  const getStatusPriority = (status) => {
    const priorities = {
      'active': 1,
      'pending': 2,
      'rejected': 3,
      'completed': 4
    };
    return priorities[status] || 5;
  };

  const sortEnrollments = (enrollments) => {
    return enrollments.sort((a, b) => {
      // First priority: status
      const statusPriorityA = getStatusPriority(a.status);
      const statusPriorityB = getStatusPriority(b.status);
      
      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }
      
      // Second priority: date (most recent first within same status)
      const dateA = a.acceptedAt ? new Date(a.acceptedAt) : new Date(0);
      const dateB = b.acceptedAt ? new Date(b.acceptedAt) : new Date(0);
      return dateB - dateA;
    });
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!userDetailData?.userIdCl) return;

      try {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(enrollmentsRef, where('clientIdCl', '==', userDetailData.userIdCl));
        const snapshot = await getDocs(q);
        
        const enrollmentsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = {
              id: doc.id,
              ...doc.data()
            };
            return await checkAndUpdateStatus(data);
          })
        );

        const sortedEnrollments = sortEnrollments(enrollmentsData);
        setEnrollments(sortedEnrollments);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [userDetailData, checkAndUpdateStatus]);

  const renderEnrollments = () => {
    if (enrollments.length === 0) {
      return (
        <div className="p-8 text-center text-white bg-gray-800 rounded-lg">
          <h3 className="text-xl font-semibold">No Enrollments Found</h3>
          <p className="mt-2 text-gray-300">You haven't enrolled with any mentor yet.</p>
        </div>
      );
    }

    // Group enrollments by status
    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const rejectedEnrollments = enrollments.filter(e => e.status === 'rejected');

    return (
      <div className="mb-4">
        {activeEnrollments.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {activeEnrollments.map(enrollment => (
              <MyEnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                calculateEndDate={calculateEndDate}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>
        )}

        {pendingEnrollments.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {pendingEnrollments.map(enrollment => (
              <MyEnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                calculateEndDate={calculateEndDate}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>
        )}

        {completedEnrollments.length > 0 && (
          <div  className="flex flex-wrap gap-4">
            {completedEnrollments.map(enrollment => (
              <MyEnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                calculateEndDate={calculateEndDate}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>
        )}

        {rejectedEnrollments.length > 0 && (
          <div className="flex flex-wrap w-full gap-4">
            {rejectedEnrollments.map(enrollment => (
              <MyEnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                calculateEndDate={calculateEndDate}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0 p-3 text-white bg-tprimary sticky-top">
          <h1 className="text-3xl font-bold cursor-pointer" onClick={handleOpenClose}>My Enrollments</h1>
          <p className="mt-2">View all your enrollment details and Instructor information</p>
        </div>
       
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          {loading ? (
            <div className="text-center text-white">Loading enrollment details...</div>
          ) : (
            renderEnrollments()
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default MyEnrollment;