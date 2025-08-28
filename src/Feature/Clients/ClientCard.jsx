import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import toast from 'react-hot-toast';

const ClientCard = ({ client }) => {
  const [enrollmentStatus, setEnrollmentStatus] = useState(client.status);

  

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'N/A';
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateEndDate = (enrollment) => {
    if (!enrollment.acceptedAt || !enrollment.package) return null;

    const startDate = new Date(enrollment.acceptedAt);
    const packageType = enrollment.package.type;
    
    if (packageType === 'hourly') {
      const rate = enrollment.package.rate;
      const minutes = (rate && !isNaN(parseInt(rate))) ? parseInt(rate) : 0;
      return new Date(startDate.getTime() + minutes * 60000);
    } else {
      const packageDays = {
        monthly: 30,
        quarterly: 90,
        halfYearly: 180,
        yearly: 365
      }[packageType] || 0;
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + packageDays);
      return endDate;
    }
  };

  const checkEnrollmentStatus = async () => {
    if (client.status === 'pending' || client.status === 'rejected') {
      return client.status;
    }

    if (!client.acceptedAt) {
      return 'pending';
    }

    const currentDate = new Date();
    const endDate = calculateEndDate(client);

    if (!endDate) return client.status;

    const newStatus = currentDate > endDate ? 'completed' : 'active';

    // Update status in Firestore if it has changed
    if (newStatus !== client.status) {
      try {
        const enrollmentRef = doc(db, 'enrollments', client.id);
        await updateDoc(enrollmentRef, { status: newStatus });
        setEnrollmentStatus(newStatus);
      } catch (error) {
        console.error('Error updating enrollment status:', error);
      }
    }

    return newStatus;
  };

  useEffect(() => {
    checkEnrollmentStatus();
  }, [client]);

  const handleEnrollmentAction = async (action) => {
    try {
      const enrollmentRef = doc(db, 'enrollments', client.id);
      const status = action === 'accept' ? 'active' : 'rejected';
      const now = new Date().toISOString();
      
      let updateData = {
        status,
        ...(status === 'active' && { acceptedAt: now }),
        ...(status === "rejected" && { rejectedBy: "mentor" }),
      };
      
      // Calculate endDate when accepting
      if (status === 'active') {
        const endDate = calculateEndDate({
          acceptedAt: now,
          package: client.package
        });
        if (endDate) {
          updateData.endDate = endDate.toISOString();
        }
      }
      
      await updateDoc(enrollmentRef, updateData);
      setEnrollmentStatus(status);
      toast.success(`Successfully ${action}ed enrollment`);
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast.error(`Failed to ${action} enrollment`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600';
      case 'active':
        return 'bg-green-600';
      case 'completed':
        return 'bg-blue-600';
      case 'rejected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatEndDate = (client) => {
    const endDate = calculateEndDate(client);
    if (!endDate) return 'N/A';

    if (client.package.type === 'hourly') {
      return endDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } else {
      return endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="p-6 mb-4 transition-all bg-gray-800 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-2 text-xl font-bold text-white">{client.clientName}</h3>
          <div className="space-y-2 text-gray-300">
            <p>Age: {calculateAge(client.clientDetails?.birthDate)} years</p>
            <p>Gender: {client.clientDetails?.gender || 'N/A'}</p>
            <p>Goals: {client.clientDetails?.goals || 'N/A'}</p>
            <div className="mt-4">
              <p>Height: {client.clientDetails?.height || 'N/A'} cm</p>
              <p>Weight: {client.clientDetails?.weight || 'N/A'} kg</p>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Activity Level:</p>
              <p>{client.clientDetails?.activityLevel?.subtitle} Factor: {client.clientDetails?.activityLevel?.factor}</p>
            </div>
            {client.acceptedAt && (
              <>
                <p className="mt-2">Enrolled: {new Date(client.acceptedAt).toLocaleDateString()}</p>
                <p>End Date: {formatEndDate(client)}</p>
              </>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 text-sm text-white rounded-full ${getStatusColor(enrollmentStatus)}`}>
          {enrollmentStatus ? enrollmentStatus.charAt(0).toUpperCase() + enrollmentStatus.slice(1) : 'Pending'}
        </div>
      </div>

      {enrollmentStatus === 'pending' && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleEnrollmentAction('accept')}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={() => handleEnrollmentAction('reject')}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientCard;