'use client'
import React, { useState, useEffect } from "react";
import { Progress } from "@material-tailwind/react";
import { db } from "@/firebase/firebaseConfig"; // Assuming you have this configured
import { collection, query, where, getDocs } from "@firebase/firestore"; // Import getDocs
import { isEqual, startOfDay } from 'date-fns'; // Ensure date-fns is installed


const MacroTracker = ({
  macroData,
  caloriesLeft,
  macrosLeft,
  totalCaloriesPlanned, // Rename prop
  plannedCarbs,
  plannedProtein,
  plannedFat,
  userId, selectedDate, dietId,
  handleRefetch
}) => {

  const [userMeals, setUserMeals] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchUserMeals = async () => {
    setLoading(true)
    try {
      const mealCollectionRef = collection(db, "meals")
      // Modified query to include dietId filter when available
      let q;
      if (dietId) {
        q = query(
          mealCollectionRef,
          where("userId", "==", userId),
          where("dietId", "==", dietId)
        );
      } else {
        q = query(mealCollectionRef, where("userId", "==", userId));
      }

      const querySnapshot = await getDocs(q);

      const mealsByCategory = {};
      querySnapshot.forEach((doc) => {
        const mealData = doc.data();

        // Ensure mealData.date is handled correctly (Firebase timestamp, string, or Date object)
        let mealDate;
        if (mealData.date) {
            if (typeof mealData.date === 'string') {
                mealDate = new Date(mealData.date);  // Parse string to Date
            } else if (mealData.date.toDate) {
                mealDate = mealData.date.toDate(); // Convert Firebase Timestamp to Date
            } else {
                mealDate = new Date(mealData.date); // Assume it's already a Date object
            }
        } else {
            mealDate = new Date(); // Or handle the missing date appropriately
        }



        if (isEqual(startOfDay(mealDate), startOfDay(selectedDate))) {
          const category = mealData.meal;
          if (!mealsByCategory[category]) {
            mealsByCategory[category] = [];
          }
          mealsByCategory[category].push({ id: doc.id, ...mealData });
        }
      });
      setUserMeals(mealsByCategory);
    } catch (error) {
      console.error("Error fetching user meals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    

    if (userId) {
      fetchUserMeals();
      handleRefetch(() => fetchUserMeals)
    } else {
      setLoading(false);
    }
  }, [userId, selectedDate, dietId]);

  // Calculate consumed macros and calories
  const consumedMacros = Object.values(userMeals).flat().reduce(
    (acc, meal) => {
      acc.calories += Number(meal.calories || 0); // Use Number() to ensure correct calculation, provide default 0
      acc.carbs += Number(meal.carbs || 0);
      acc.protein += Number(meal.protein || 0);
      acc.fat += Number(meal.fats || 0);
      return acc;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );


  const numberOnly = totalCaloriesPlanned.match(/\d+/)[0];
  // Calculate remaining macros and calories (use consumedMacros)
  const remainingCalories = Number(numberOnly) - consumedMacros.calories;
  const remainingCarbs = plannedCarbs - consumedMacros.carbs;
  const remainingProtein = plannedProtein - consumedMacros.protein;
  const remainingFat = plannedFat - consumedMacros.fat;



  const carbsPercentage =
    plannedCarbs > 0 ? ((consumedMacros.carbs) / plannedCarbs) * 100 : 0;
  const proteinPercentage =
    plannedProtein > 0 ? ((consumedMacros.protein) / plannedProtein) * 100 : 0;
  const fatPercentage =
    plannedFat > 0 ? ((consumedMacros.fat) / plannedFat) * 100 : 0;



  return (
    <div className="p-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="">
          <div className="relative w-36 ">
            <div className="inset-0 flex flex-col">
              <span className="text-3xl font-bold text-gray-800">
                {remainingCalories.toFixed(0)} {/* Use calculated remaining calories */}
              </span>
              <span className="text-xs text-gray-500">KCALS LEFT</span>
              <span className="text-xs text-gray-500">
                Total KCALS Planned: {totalCaloriesPlanned}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-[16px] h-[16px] bg-[red]"></span>CARBS
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[16px] h-[16px] bg-blue-500"></span>PROTEIN
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[16px] h-[16px] bg-[#ffc107]"></span>FAT
            </div>
          </div>
        </div>
        <div className="w-1/2 space-y-3">
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-600">
              <span>CARBS</span>
              <span>{remainingCarbs.toFixed(0)}g left</span> {/* Use calculated remaining carbs */}
            </div>
            <Progress value={carbsPercentage} color="red" className="h-2" />
          </div>
          <div>
            <div className="flex justify-between my-2 text-xs text-gray-600">
              <span>PROTEIN</span>
              <span>{remainingProtein.toFixed(0)}g left</span> {/* Use calculated remaining protein */}
            </div>
            <Progress value={proteinPercentage} color="blue" className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-600">
              <span>FAT</span>
              <span>{remainingFat.toFixed(0)}g left</span> {/* Use calculated remaining fat */}
            </div>
            <Progress value={fatPercentage} color="amber" className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroTracker;