'use client';
import _ from 'lodash';
import Image from 'next/image';
import React, { useContext, useEffect, useState } from 'react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import toast from 'react-hot-toast';
import { Select, Option } from "@material-tailwind/react";
import { GlobalContext } from '@/context/GloablContext';

const ClientCard = ({client}) => {
  const {plans,userDetailData} = useContext(GlobalContext);
  const [enrollmentStatus, setEnrollmentStatus] = useState(client?.status);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState(null);
  const [workoutPlanName, setWorkoutPlanName] = useState('');
  const assignablePlans = plans?.filter(plan => !plan?.workoutPlanDB?.progress);

  

  const handleWorkoutPlanAssignment = async () => {
    if (!selectedWorkoutPlan) {
      toast.error('Please select a workout plan');
      return;
    }
    
    const planToAssign = { ...selectedWorkoutPlan };
    planToAssign.userIdCl = client?.clientIdCl;
    planToAssign.mentorName = userDetailData?.userName;
    planToAssign.mentorEmail = userDetailData?.userEmail;
    planToAssign.mentorId = userDetailData?.userIdCl;
    
    // Use custom name if provided, otherwise use original name
    if (workoutPlanName.trim()) {
      planToAssign.planName = `workoutPlan_${workoutPlanName.trim()}`;
    }
    
    try {
      await addDoc(collection(db, 'workoutPlans'), planToAssign);
      toast.success('Workout plan assigned successfully');
    } catch (error) {
      console.error('Error assigning workout plan:', error);
      toast.error('Failed to assign workout plan');
    }
  };

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

  const calculateEndDate = (enrollment) => {
    if (!enrollment.acceptedAt || !enrollment.package) return null;

    const startDate = new Date(enrollment.acceptedAt);
    const packageType = enrollment.package.type;
    
    if (packageType === 'hourly') {
      const minutes = parseInt(enrollment.package.rate) || 0;
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
    if (client?.status === 'pending' || client?.status === 'paid_pending' || client?.status === 'rejected') {
      return client?.status;
    }

    if (!client?.acceptedAt) {
      return 'pending';
    }

    const currentDate = new Date();
    const endDate = calculateEndDate(client);

    if (!endDate) return client?.status;

    const newStatus = currentDate > endDate ? 'completed' : 'active';

    // Update status in Firestore if it has changed
    if (newStatus !== client?.status) {
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
      
      if(action === 'accept' && selectedWorkoutPlan) {
        await updateDoc(enrollmentRef, updateData);
        setEnrollmentStatus(status);
        toast.success(`Successfully ${action}ed enrollment`);
        handleWorkoutPlanAssignment();
      } else if(action === 'reject') {
        await updateDoc(enrollmentRef, updateData);
        setEnrollmentStatus(status);
        toast.success(`Successfully ${action}ed enrollment`);
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast.error(`Failed to ${action} enrollment`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600';
      case 'paid_pending':
        return 'bg-blue-600';
      case 'active':
        return 'bg-green-600';
      case 'completed':
        return 'bg-gray-600';
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
    <div className="p-6 mb-4 overflow-hidden bg-white shadow-lg rounded-xl max-w-[500px]">
      {/* Background gradient */}
      <div className="h-32 mb-4 -mx-6 -mt-6 bg-gradient-to-r from-[#000000]  to-[#434343]"></div>
      
      {/* Profile section */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          {/* Profile image */}
          <div className="w-16 h-16 -mt-12 overflow-hidden border-4 border-white rounded-full">
            <Image
              width={56}
              height={56} 
              src={client?.package?.profileImage} 
              alt="Profile" 
              className="object-cover w-full h-full"
            />
          </div>
          
          {/* Name and location */}
          <div>
            <h1 className="text-xl font-semibold">{_.capitalize(client?.package?.fullName)} ({client?.clientDetails?.gender} - {calculateAge(client?.clientDetails?.birthDate)} years)</h1>
            <p className="text-sm text-black"><span className='font-semibold'>Weight:</span> {client?.clientDetails?.weight} <span className='font-semibold'>Height:</span> {client?.clientDetails?.height}</p>
            <p className="text-sm text-gray-600">{client?.package?.phoneNumber}</p>
            <div className={`px-2 py-1 text-sm text-center text-white rounded-full w-100 ${getStatusColor(enrollmentStatus)}`}>
          {enrollmentStatus === 'paid_pending' ? 'Paid Pending' : enrollmentStatus?.charAt(0).toUpperCase() + enrollmentStatus?.slice(1)}
        </div>
          </div>
        </div>
        
       
      </div>
      {(enrollmentStatus === 'pending' || enrollmentStatus === 'paid_pending') && 
      <div className="mt-3 space-y-3">
        <Select 
          label="Assign Workout Plan" 
          onChange={(value) => {
            const plan = assignablePlans.find(p => p.id === value);
            setSelectedWorkoutPlan(plan);
            if (plan) {
              setWorkoutPlanName(plan.planName.replace('workoutPlan_', ''));
            }
          }}
        >
          {assignablePlans?.map((plan) => (
            <Option key={plan.id} value={plan.id}>
              {plan.planName.replace('workoutPlan_', '')}
            </Option>
          ))}
        </Select>
        
        {selectedWorkoutPlan && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Enter custom workout plan name"
              value={workoutPlanName}
              onChange={(e) => setWorkoutPlanName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be the name assigned to the client. Leave default or customize.
            </p>
          </div>
        )}
        
      </div>
      }
      
      {/* Action buttons */}
      {(enrollmentStatus === 'pending' || enrollmentStatus === 'paid_pending') && 
      <div className="flex gap-3 mt-4">
      {selectedWorkoutPlan && 
        <button disabled={!selectedWorkoutPlan} onClick={() => handleEnrollmentAction('accept')} className="w-full px-4 py-2 text-sm font-medium text-white rounded-full bg-success">
          Accept
        </button>}
        <button onClick={() => handleEnrollmentAction('reject')} className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full">
          Reject
        </button>
      </div>}
      
      {/* Skills */}
      <div className="flex gap-2 mt-4 mb-2 overflow-auto flex-nowrap">
        <span className='font-semibold'>Availability </span> :{client?.package?.availability?.days?.map((skill) => (
          <span key={skill} className="px-2 py-1 text-sm text-center text-gray-600 rounded-full min-w-max bg-gray-50 line-clamp-1">

            {skill}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2 overflow-auto flex-nowrap">
        <span className='font-semibold'>Timeslot :</span> 
          <span className="px-2 py-1 text-sm text-center text-white bg-black rounded-full min-w-max line-clamp-1">
            {client?.package?.availability?.timeSlot}
          </span>
          {client?.acceptedAt && <p className=""><span  className='font-semibold'>Enrolled:</span> {new Date(client?.acceptedAt).toLocaleDateString()}</p>}
      </div>
      
      {/* Specific Times */}
      {client?.package?.availability?.specificTimes && client?.package?.availability?.specificTimes.length > 0 && (
        <div className="mb-2">
          <span className='font-semibold'>Preferred Times:</span>
          <div className="flex gap-2 mt-1 overflow-auto flex-nowrap">
            {client.package.availability.specificTimes.map((timeSlot, index) => (
              <span 
                key={index} 
                className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded-full min-w-max"
              >
                {timeSlot}
              </span>
            ))}
          </div>
        </div>
      )}
      {client?.acceptedAt && (
                <p className='mb-2'><span  className='font-semibold'>End Date:</span>  {formatEndDate(client)}</p>
            )}
      
      {/* Action cards */}
      <div className="flex flex-wrap gap-2">
  <div className="p-2 bg-gray-50 rounded-xl flex-1 min-w-[200px]">
      <p className="font-medium">Activity Level</p>
    <p className="mt-2 text-sm text-gray-600">
      {client?.clientDetails?.activityLevel?.subtitle}
    </p>
  </div>
  <div className="p-2 bg-black text-white rounded-xl flex-1 min-w-[200px]">
    
      <p className="font-medium">Goal</p>
    
    <p className="mt-2 text-sm ">
      {client?.package?.biography}
    </p>
  </div>
</div>

    </div>
  );
};

export default ClientCard;