"use client";
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';

import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import { db } from "@/firebase/firebaseConfig";
import EnrollmentStatus from '@/components/EnrollmentStatus';





const MyEnrollment = () => {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userDetailData,handleOpenClose } = useContext(GlobalContext);

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
    
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(isHourly && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    });
  }, []);

  const checkAndUpdateStatus = useCallback(async (enrollmentData) => {
    if (!enrollmentData || enrollmentData.status === 'pending' || enrollmentData.status === 'rejected') {
      return enrollmentData;
    }

    const endDate = calculateEndDate(enrollmentData);
    if (!endDate) return enrollmentData;

    const newStatus = new Date() > endDate ? 'completed' : 'active';
    
    if (newStatus !== enrollmentData.status) {
      const enrollmentRef = doc(db, 'enrollments', enrollmentData.id);
      await updateDoc(enrollmentRef, { status: newStatus });
      return { ...enrollmentData, status: newStatus };
    }

    return enrollmentData;
  }, [calculateEndDate]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!userDetailData?.userIdCl) return;

      try {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(enrollmentsRef, where('clientIdCl', '==', userDetailData.userIdCl));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const enrollmentData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          };
          
          const updatedEnrollment = await checkAndUpdateStatus(enrollmentData);
          setEnrollment(updatedEnrollment);
        }
      } catch (error) {
        console.error('Error fetching enrollment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [userDetailData, checkAndUpdateStatus]);

  
  return (
    <SecureComponent>
      <div className="flex flex-col min-h-screen bg-tprimary">
        <div className="p-6 text-white">
          <h1 className="text-3xl font-bold" onClick={handleOpenClose}>My Enrollment</h1>
          <p className="mt-2 text-gray-300">View your enrollment details and mentor information</p>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="text-center text-white">Loading enrollment details...</div>
          ) : enrollment ? (
            <EnrollmentStatus 
              enrollment={enrollment}
              calculateEndDate={calculateEndDate}
              formatDateTime={formatDateTime}
            />
          ) : (
            <div className="p-8 text-center text-white bg-gray-800 rounded-lg">
              <h3 className="text-xl font-semibold">No Active Enrollment</h3>
              <p className="mt-2 text-gray-300">You haven't enrolled with any mentor yet.</p>
            </div>
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default MyEnrollment;