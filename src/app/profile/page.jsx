"use client";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import React, { useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";
import ButtonCs from "@/components/Button/ButtonCs";
import _ from "lodash";

import { BackgroundGradientAnimation } from "@/components/AnimatedBackground";
import { calculateBMI, goals } from "@/utils";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { insertUserMetrics } from "@/utils/metricsHelper";
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useUser();
  const {
    userDetailData,
    latestWeight,
    userAgeCal,
    userId,
    userWeightRefetch,
    userRefetch,
    weight,
    setWeight,
    height,
    setHeight,
  } = useContext(GlobalContext);

  const {
    userName,
    userBirthDate,
    userGender,
    userHeight,
    helpYou,
    activityLevel,
    userEmail,
  } = userDetailData;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWeight(latestWeight?.userWeights);
    setHeight(userHeight);
  }, [userHeight, latestWeight?.userWeights]);

  const updateUserDetail = async () => {
    // Build the update object dynamically
    const updateFields = {};
    if (weight !== undefined) {
      updateFields.userWeight = weight;
    }
    if (height !== undefined) {
      updateFields.userHeight = height;
    }

    // Proceed only if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return { success: true };
    }

    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, updateFields);
      userRefetch();
      return { success: true };
    } catch (error) {
      console.log("Error while updating user details: ", error);
      return { success: false, error };
    }
  };

  const handleSave = async () => {
    if (!weight || !height) {
      toast.error('Please enter both weight and height');
      return;
    }

    setIsSaving(true);
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Saving your changes...');

      // Update user details in users collection
      const updateResult = await updateUserDetail();
      if (!updateResult.success) {
        throw new Error('Failed to update user details');
      }

      // Insert metrics into unified collection
      const metricsData = {
        weight: parseFloat(weight),
        height: parseFloat(height)
      };

      const result = await insertUserMetrics(userId, metricsData, 'update', 'profile_edit');

      if (result.success) {
        // Refresh data
        userWeightRefetch();
        userRefetch();
        
        setIsEditing(false);
        
        // Show success toast
        toast.success('Profile updated successfully!', { id: loadingToast });
      } else {
        throw new Error(result.error || 'Failed to save metrics');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const splitHelpYou = helpYou?.split(",");
  const filteredGoals = goals?.filter((goal) =>
    splitHelpYou?.map((item) => item?.trim()).includes(goal?.id)
  );

  const bmi = calculateBMI(latestWeight?.userWeights, userHeight);

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0  sticky-top !-z-[999999] relative  h-[200px] overflow-hidden">
          <BackgroundGradientAnimation />
        </div>
        <div className="flex items-end gap-x-2 sticky-top ml-[20px] mt-[-40px]">
          <div className=" min-w-[120px] min-h-[120px] max-w-[120px] max-h-[120px] bg-glass  z-20  rounded-xl p-2 ">
            <div className="bg-white h-[100%] w-[100%] rounded-xl">
              <img
                src={user?.imageUrl}
                alt="profileImage"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="mb-2">
            <h2 className="text-xl font-bold">{_.upperFirst(userName)}</h2>
            <p className="text-gray-500">{userEmail}</p>
          </div>
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          <div className="p-6 mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-gray-600">
                <p>Gender</p>
                <p className="font-semibold text-black">{userGender}</p>
              </div>
              <div className="text-right text-gray-600">
                <p>Age</p>
                <p className="font-semibold text-black">{userAgeCal} years</p>
              </div>
              <div className="text-gray-600">
                <p>Height</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="cm"
                    min="100"
                    max="250"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="font-semibold text-black">{height} cm</p>
                )}
              </div>
              <div className="text-right text-gray-600">
                <p>Weight</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="kg"
                    min="30"
                    max="300"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="font-semibold text-black">{weight} kg</p>
                )}
              </div>
            </div>
            <div className="mb-2 ">
              <p className="text-gray-600">Help to</p>
              <div className="gap-2 mt-2">
                {filteredGoals?.map((i) => (
                  <p className={`p-2 whitespace-nowrap w-100 text-black  ${i?.color}`}>
                    <span className="mr-2">{i?.icon}</span>
                    {i?.title}
                  </p>
                ))}
              </div>
            </div>

            <ButtonCs
              title={isEditing ? (isSaving ? "Saving..." : "Save") : "Edit"}
              className="w-100"
              disabled={isSaving}
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            />
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default Profile;
