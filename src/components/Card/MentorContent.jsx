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
  const [pendingEnrollment, setPendingEnrollment] = useState(null);
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
    const checkEnrollments = async () => {
      if (!userDetailData?.userIdCl) return;

      try {
        // Check for active enrollments
        const activeEnrollmentsRef = collection(db, "enrollments");
        const activeQuery = query(
          activeEnrollmentsRef,
          where("clientIdCl", "==", userDetailData.userIdCl),
          where("status", "==", "active")
        );

        // Check for pending enrollments
        const pendingEnrollmentsRef = collection(db, "enrollments");
        const pendingQuery = query(
          pendingEnrollmentsRef,
          where("clientIdCl", "==", userDetailData.userIdCl),
          where("status", "==", "pending")
        );

        const [activeSnapshot, pendingSnapshot] = await Promise.all([
          getDocs(activeQuery),
          getDocs(pendingQuery)
        ]);

        // Process active enrollments
        const activeEnrollments = [];
        activeSnapshot.forEach((doc) => {
          activeEnrollments.push({ id: doc.id, ...doc.data() });
        });

        if (activeEnrollments.length > 0) {
          const latestActive = activeEnrollments.reduce((latest, current) => {
            return new Date(current.enrolledAt) > new Date(latest.enrolledAt)
              ? current
              : latest;
          });
          setExistingEnrollment(latestActive);
        }

        // Process pending enrollments
        const pendingEnrollments = [];
        pendingSnapshot.forEach((doc) => {
          pendingEnrollments.push({ id: doc.id, ...doc.data() });
        });

        if (pendingEnrollments.length > 0) {
          const latestPending = pendingEnrollments.reduce((latest, current) => {
            return new Date(current.enrolledAt) > new Date(latest.enrolledAt)
              ? current
              : latest;
          });
          setPendingEnrollment(latestPending);
        }

      } catch (error) {
        console.error("Error checking enrollments:", error);
        toast.error("Failed to check enrollment status");
      } finally {
        setLoading(false);
      }
    };

    checkEnrollments();
  }, [userDetailData]);

  const calculateEndDate = (enrollment) => {
    if (!enrollment) return null;

    const enrollmentDate = new Date(enrollment.enrolledAt);
    const packageType = enrollment.package.type;
    
    if (packageType === 'hourly') {
      const minutes = parseInt(enrollment.package.rate) || 0;
      const endDate = new Date(enrollmentDate.getTime() + minutes * 60000);
      return endDate;
    } else {
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
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } else {
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

    // First check for pending enrollment
    if (pendingEnrollment) {
      return (
        <div className="p-4 text-center bg-yellow-500 rounded-lg">
          <p className="font-medium">
            You have a pending enrollment request with {pendingEnrollment.mentorName}.
            Please wait for their response before making new enrollment requests.
          </p>
        </div>
      );
    }

    // Then check for active enrollment
    if (existingEnrollment) {
      const isSameMentor = existingEnrollment.mentorIdCl === mentor.userIdCl;
      const isActive = isEnrollmentActive(existingEnrollment);
      const endDate = calculateEndDate(existingEnrollment);

      if (isSameMentor && isActive) {
        return (
          <div className="p-4 text-center bg-green-500 rounded-lg">
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

    // If no pending or active enrollments, show the enrollment form
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