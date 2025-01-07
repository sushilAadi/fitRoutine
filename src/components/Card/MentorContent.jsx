'use client'
import InputBlk from '@/components/InputCs/InputBlk';
import { GlobalContext } from '@/context/GloablContext';
import { db } from '@/firebase/firebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import toast from 'react-hot-toast';

const MentorContent = ({ mentor }) => {
  const { userDetailData } = useContext(GlobalContext);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedRate, setSelectedRate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const rateOptions = [
    { id: 'hourly', label: 'Hourly', rate: mentor.hourly_rate },
    { id: 'daily', label: 'Daily', rate: mentor.per_day_rate },
    { id: 'monthly', label: 'Monthly', rate: mentor.monthly_rate },
    { id: 'quarterly', label: 'Quarterly', rate: mentor.quarterly_rate },
    { id: 'halfYearly', label: 'Half Yearly', rate: mentor.half_yearly_rate },
    { id: 'yearly', label: 'Yearly', rate: mentor.yearly_rate }
  ];

  const calculateTotal = () => {
    const rates = {
      hourly: mentor.hourly_rate,
      daily: mentor.per_day_rate,
      monthly: mentor.monthly_rate,
      quarterly: mentor.quarterly_rate,
      halfYearly: mentor.half_yearly_rate,
      yearly: mentor.yearly_rate
    };
    return rates[selectedRate] * quantity;
  };

  const toggleSelection = (array, value) => {
    return array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  const handleEnroll = async () => {
    if (!userDetailData || !mentor) return;
    
    setEnrolling(true);
    try {
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
        package: {
          type: selectedRate,
          quantity,
          total: calculateTotal(),
          selectedSpecializations,
          selectedDays,
          selectedHour,
          selectedLocation
        },
        enrolledAt: new Date().toISOString(),
        status: 'active'
      };
      console.log("enrollmentData",enrollmentData)

      await addDoc(collection(db, 'enrollments'), enrollmentData);
      toast('Successfully enrolled with the coach!');
    } catch (error) {
      console.error('Error enrolling:', error);
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
        <p><strong>Availability:</strong> {mentor.availabilityDays.map(day => day.label).join(', ')}</p>
        <p><strong>Qualifications:</strong> {mentor.qualifications.map(qual => qual.label).join(', ')}</p>
        
        <div className="p-4 my-4 space-y-6 border rounded-lg">
        <div>
            <h5 className="mb-3 font-medium">Select Rate Type</h5>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {rateOptions.map((option) => (
                <div
                  key={option.id}
                  className={`px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    selectedRate === option.id 
                      ? 'border-gary-300 bg-gray-700'
                      : ''
                  }`}
                  onClick={() => setSelectedRate(option.id)}
                >
                  <div className="text-center">
                    <p className="font-medium">{option.label}</p>
                    <p className="font-bold">₹{option.rate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRate && (
            <InputBlk
              title={`Number of ${selectedRate.charAt(0).toUpperCase() + selectedRate.slice(1)}`}
              name="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          )}

          {selectedRate && (
            <p className="mt-2 font-bold">Total: ₹{calculateTotal()}</p>
          )}

          <div>
            <h5 className="mb-3 font-medium">Select Specializations</h5>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {mentor.specializations.map((spec) => (
                <div
                  key={spec.value}
                  className={`px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    selectedSpecializations.includes(spec.value)
                      ? 'border-gary-300 bg-gray-700'
                      : ''
                  }`}
                  onClick={() => setSelectedSpecializations(prev => toggleSelection(prev, spec.value))}
                >
                  <p className="text-center">{spec.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-3 font-medium">Select Days</h5>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
              {mentor.availabilityDays.map((day) => (
                <div
                  key={day.value}
                  className={`px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    selectedDays.includes(day.value)
                      ? 'border-gary-300 bg-gray-700'
                      : ''
                  }`}
                  onClick={() => setSelectedDays(prev => toggleSelection(prev, day.value))}
                >
                  <p className="text-center">{day.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-3 font-medium">Set Your Schedule</h5>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {mentor.availabilityHours.map((hour) => (
                <div
                  key={hour.value}
                  className={`px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    selectedHour === hour.value
                      ? 'border-gary-300 bg-gray-700'
                      : ''
                  }`}
                  onClick={() => setSelectedHour(hour.value)}
                >
                  <p className="text-center">{hour.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-3 font-medium">Select Training Location</h5>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {mentor.trainingLocations.map((loc) => (
                <div
                  key={loc.value}
                  className={`px-3 py-2 border rounded-lg cursor-pointer transition-all text-sm ${
                    selectedLocation === loc.value
                      ? 'border-gary-300 bg-gray-700'
                      : ''
                  }`}
                  onClick={() => setSelectedLocation(loc.value)}
                >
                  <p className="text-center">{loc.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        
        <button
          onClick={handleEnroll}
          disabled={!selectedRate || enrolling}
          className={`w-full py-2 my-5 text-white transition-colors rounded-full ${
            !selectedRate || enrolling 
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