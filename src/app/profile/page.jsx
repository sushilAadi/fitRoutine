"use client";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import React, { useContext, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";
import ButtonCs from "@/components/Button/ButtonCs";
import _ from "lodash";
import { supabase } from "@/createClient";
import BlurryBlob from "@/components/BlurryBlob/BlurryBlob";
import { BackgroundGradientAnimation } from "@/components/AnimatedBackground";
import { goals } from "@/utils";
import { button } from "@material-tailwind/react";

const Profile = () => {
  const { user } = useUser();
  const {
    userDetailData,
    latestWeight,
    userAgeCal,
    userId,
    userWeightRefetch,
    userRefetch,
    handleOpenClose,
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

  console.log("userDetailData", { helpYou, activityLevel });
  useEffect(() => {
    setWeight(latestWeight?.userWeights);
    setHeight(userHeight);
  }, [userHeight, latestWeight?.userWeights]);

  console.log("user", { user, userDetailData });

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
      console.log("No fields to update.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateFields)
      .eq("userIdCl", userId);

    if (error) {
      console.log("Error while updating user details: ", error);
    } else {
      console.log("User details updated successfully: ");
      userRefetch;
    }
  };

  const insertWeight = async () => {
    const { data, error } = await supabase.from("weight").insert({
      userIdCl: userId,
      userWeights: weight,
    });
    if (error) {
      console.log("Weight Error: ", error);
    } else {
      console.log("Weight posted successfully: ", data);
      userWeightRefetch();
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    updateUserDetail();
    insertWeight();
  };
  const splitHelpYou = helpYou?.split(",");
  const filteredGoals = goals?.filter((goal) =>
    splitHelpYou?.map((item) => item?.trim()).includes(goal?.id)
  );
  

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
                    className="w-20 px-2 py-1 border rounded"
                  />
                ) : (
                  <p className="font-semibold text-black">{height} cms</p>
                )}
              </div>
              <div className="text-right text-gray-600">
                <p>Weight</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-20 px-2 py-1 border rounded"
                  />
                ) : (
                  <p className="font-semibold text-black">{weight} kgs</p>
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
              title={isEditing ? "Save" : "Edit"}
              className="w-100"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            />
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default Profile;
