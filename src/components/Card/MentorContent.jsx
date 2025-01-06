import { GlobalContext } from '@/context/GloablContext';
import { db } from '@/firebase/firebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import React, { useContext, useState } from 'react';

const MentorContent = ({ mentor }) => {
  const { userDetailData } = useContext(GlobalContext);
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!userDetailData || !mentor) return;
    
    setEnrolling(true);
    try {
      // Create enrollment document
      const enrollmentData = {
        mentorIdCl: mentor.userIdCl,
        mentorName: mentor.name,
        mentorEmail: mentor.email,
        clientIdCl: userDetailData.userIdCl,
        clientName: userDetailData.userName,
        clientEmail: userDetailData.userEmail,
        clientDetails: {
          gender: userDetailData.userGender,
          birthDate: userDetailData.userBirthDate,
          height: userDetailData.userHeight,
          weight: userDetailData.userWeight,
          goals: userDetailData.helpYou,
          activityLevel: userDetailData.activityLevel
        },
        enrolledAt: new Date().toISOString(),
        status: 'active'
      };

      await addDoc(collection(db, 'enrollments'), enrollmentData);
      alert('Successfully enrolled with the coach!');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="">
      <div className="space-y-2">
        <p><strong>Experience:</strong> {mentor.experience_years} years</p>
        <p><strong>Languages:</strong> {mentor.languages.map(lang => lang.label).join(', ')}</p>
        <p><strong>Specializations:</strong> {mentor.specializations.map(spec => spec.label).join(', ')}</p>
        <p><strong>Training Locations:</strong> {mentor.trainingLocations.map(loc => loc.label).join(', ')}</p>
        <p><strong>Rates:</strong></p>
        <ul className="pl-4 mt-0 list-none">
          <li>Hourly: ₹{mentor.hourly_rate}</li>
          <li>Monthly: ₹{mentor.monthly_rate}</li>
          <li>Half Yearly: ₹{mentor.half_yearly_rate}</li>
          <li>Yearly: ₹{mentor.yearly_rate}</li>
        </ul>
        <p><strong>Availability:</strong> {mentor.availabilityDays.map(day => day.label).join(', ')}</p>
        <p><strong>Qualifications:</strong> {mentor.qualifications.map(qual => qual.label).join(', ')}</p>
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          className={`w-full py-2 my-5 text-white transition-colors rounded-full ${
            enrolling 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {enrolling ? 'Enrolling...' : 'Enroll'}
        </button>
      </div>
    </div>
  );
};

export default MentorContent;