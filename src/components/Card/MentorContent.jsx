import React, { useContext, useState, useEffect } from "react";
import { GlobalContext } from "@/context/GloablContext";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Star, Play, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import InputBlk from "@/components/InputCs/InputBlk";
import EnrollmentForm from "./EnrollmentForm";
import MentorDetail from "./MentorDetail";
import MentorProfile from "./MentorProfile";

const MentorContent = ({ mentor }) => {
  const { userDetailData, user } = useContext(GlobalContext);
  const [enrolling, setEnrolling] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  const userRole = user?.publicMetadata?.role ?? "user";

  const rateOptions = [
    { id: "hourly", label: "Hourly", rate: mentor.hourly_rate },
    { id: "monthly", label: "Monthly", rate: mentor.monthly_rate, days: 30 },
    { id: "quarterly", label: "Quarterly", rate: mentor.quarterly_rate, days: 90 },
    { id: "halfYearly", label: "Half Yearly", rate: mentor.half_yearly_rate, days: 180 },
    { id: "yearly", label: "Yearly", rate: mentor.yearly_rate, days: 365 },
  ];

  useEffect(() => {
    const checkExistingEnrollment = async () => {
      if (!userDetailData?.userIdCl) return;

      try {
        const enrollmentsRef = collection(db, "enrollments");
        const q = query(
          enrollmentsRef,
          where("clientIdCl", "==", userDetailData.userIdCl),
          where("status", "==", "active")
        );

        const querySnapshot = await getDocs(q);
        const enrollments = [];
        querySnapshot.forEach((doc) => {
          enrollments.push({ id: doc.id, ...doc.data() });
        });

        if (enrollments.length > 0) {
          const latestEnrollment = enrollments.reduce((latest, current) => {
            return new Date(current.enrolledAt) > new Date(latest.enrolledAt)
              ? current
              : latest;
          });

          setExistingEnrollment(latestEnrollment);
        }
      } catch (error) {
        console.error("Error checking enrollment:", error);
        toast.error("Failed to check enrollment status");
      } finally {
        setLoading(false);
      }
    };

    checkExistingEnrollment();
  }, [userDetailData]);

  const calculateEndDate = (enrollment) => {
    if (!enrollment) return null;

    const enrollmentDate = new Date(enrollment.enrolledAt);
    const packageType = enrollment.package.type;
    
    if (packageType === 'hourly') {
      // For hourly packages, just add the exact minutes to the current time
      const minutes = parseInt(enrollment.package.rate) || 0;
      const endDate = new Date(enrollmentDate.getTime() + minutes * 60000); // Convert minutes to milliseconds
      return endDate;
    } else {
      // For other package types, use the existing days logic
      const packageDays = rateOptions.find(opt => opt.id === packageType)?.days || 0;
      const endDate = new Date(enrollmentDate);
      endDate.setDate(endDate.getDate() + packageDays);
      return endDate;
    }
  };

  const isEnrollmentActive = (enrollment) => {
    if (!enrollment) return false;

    const currentDate = new Date();
    const endDate = calculateEndDate(enrollment);

    return currentDate <= endDate;
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const packageType = existingEnrollment?.package?.type;
    
    if (packageType === 'hourly') {
      // For hourly packages, show precise time
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } else {
      // For other packages, show only the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const renderEnrollmentStatus = () => {
    if (loading) {
      return <div className="p-4 text-center">Checking enrollment status...</div>;
    }

    if (existingEnrollment) {
      const isSameMentor = existingEnrollment.mentorIdCl === mentor.userIdCl;
      const isActive = isEnrollmentActive(existingEnrollment);
      const endDate = calculateEndDate(existingEnrollment);

      if (isSameMentor && isActive) {
        return (
          <div className="p-4 text-center bg-red-500 rounded-lg">
            <p className="font-medium">
              You are currently enrolled with this mentor until{" "}
              {formatDate(endDate)}
            </p>
          </div>
        );
      } else if (!isSameMentor && isActive) {
        return (
          <div className="p-4 text-center bg-red-500 rounded-lg">
            <p className="font-medium">
              You are currently enrolled with {existingEnrollment.mentorName} until{" "}
              {formatDate(endDate)}. Please complete your current enrollment period 
              before enrolling with a new mentor.
            </p>
          </div>
        );
      }
    }

    return (
      <EnrollmentForm
        mentor={mentor}
        availableDays={mentor.availabilityDays?.map((day) => day.value)}
        timeSlots={mentor.availabilityHours?.map((day) => day.value)}
        rateOptions={rateOptions}
      />
    );
  };

  return (
    <div className="mx-auto overflow-hidden rounded-xl">
      <MentorProfile mentor={mentor} />
      <div className="py-6">
        <MentorDetail mentor={mentor} />
        {mentor.userIdCl !== userDetailData?.userIdCl && (
          renderEnrollmentStatus()
        )}
      </div>
    </div>
  );
};

export default MentorContent;