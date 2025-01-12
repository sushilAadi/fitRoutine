import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import toast from 'react-hot-toast';

const ClientCard = ({ client }) => {
  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleEnrollmentAction = async (action) => {
    try {
      const enrollmentRef = doc(db, 'enrollments', client.id);
      const status = action === 'accept' ? 'active' : 'rejected';
      const updateData = {
        status,
        ...(status === 'active' && { acceptedAt: new Date().toISOString() })
      };
      
      await updateDoc(enrollmentRef, updateData);
      
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
      case 'rejected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="p-6 mb-4 transition-all bg-gray-800 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-2 text-xl font-bold text-white">{client.clientName}</h3>
          <div className="space-y-2 text-gray-300">
            <p>Age: {calculateAge(client.clientDetails?.birthDate)} years</p>
            <p>Gender: {client.clientDetails?.gender}</p>
            <p>Goals: {client.clientDetails?.goals}</p>
            <div className="mt-4">
              <p>Height: {client.clientDetails?.height} cm</p>
              <p>Weight: {client.clientDetails?.weight} kg</p>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Activity Level:</p>
              <p>{client.clientDetails?.activityLevel?.subtitle} Factor: {client.clientDetails?.activityLevel?.factor}</p>
            </div>
            {client.status === 'active' && client.acceptedAt && (
              <p className="mt-2">Enrolled: {new Date(client.acceptedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 text-sm text-white rounded-full ${getStatusColor(client.status)}`}>
          {client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
        </div>
      </div>

      {client.status === 'pending' && (
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