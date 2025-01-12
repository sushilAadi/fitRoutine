"use client";
import { AppleCardsCarouselDemo } from "@/components/Card/AppleCardsCarouselDemo";
import MentorContent from "@/components/Card/MentorContent";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import { db } from "@/firebase/firebaseConfig";

import { collection, getDocs } from "firebase/firestore";

import React, { useContext, useEffect, useState } from "react";



const Coaches = () => {
  const { handleOpenClose,userDetailData,user } = useContext(GlobalContext);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("user",{userDetailData,user})

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const mentorsRef = collection(db, "Mentor");
        const snapshot = await getDocs(mentorsRef);
  
        const mentorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        // Filter out mentors with a pending status
        const filteredMentors = mentorsList.filter(mentor => mentor.status !== "pending");
  
        const formattedMentors = filteredMentors.map(mentor => ({
          category: mentor.qualifications[0]?.label || "Fitness Coach",
          title: mentor.name,
          src: mentor.profileImage,
          content: <MentorContent mentor={mentor} />,
          originalData: mentor,
          id: mentor.id,
          mentorUserId: mentor.userIdCl,
        }));
  
        setMentors(formattedMentors);
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMentors();
  }, []);
  

console.log("mentors",mentors)

  return (
    <SecureComponent>
      <div className="flex flex-col h-full min-h-screen overflow-hidden bg-tprimary">
        <div className="top-0 p-3 text-white sticky-top z-1">
          <div className="flex justify-between">
            <div className="mt-[-8px]">
              <p className="text-3xl">Choose</p>
              <p className="text-3xl">your <i>Coach</i></p>
            </div>
            <i 
              className="cursor-pointer text-white fa-duotone fa-solid fa-bars text-[20px] hambergerMenu" 
              onClick={handleOpenClose}
            />
          </div>
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          {loading ? (
            <div className="text-center text-white">Loading coaches...</div>
          ) : mentors.length > 0 ? (
            <AppleCardsCarouselDemo 
              title="Meet Our Expert Coaches" 
              data={mentors}
            />
          ) : (
            <div className="text-center text-white">No coaches available</div>
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default Coaches;