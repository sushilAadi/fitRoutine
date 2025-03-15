"use client";
import React, { useEffect, useState, useContext } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import { db } from "@/firebase/firebaseConfig";
import { startOfWeek, addDays } from "date-fns";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import MacroTracker from "@/Feature/MyDiet/MacroTracker";
import PlannedMeal from "@/Feature/MyDiet/PlannedMeal";
import WeeklyCalendar from "@/Feature/MyDiet/WeeklyCalendar";

const MyDiet = () => {
  const { userDetailData, userId } = useContext(GlobalContext);
  const [dietPlans, setDietPlans] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openAccordion, setOpenAccordion] = useState(1);
  const [macroData, setMacroData] = useState([]);
  const [caloriesLeft, setCaloriesLeft] = useState(0);
  const [macrosLeft, setMacrosLeft] = useState({
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [dietList, setDietList] = useState([]);
  const [totalCaloriesPlanned, setTotalCaloriesPlanned] = useState(0);

  console.log("dietList", dietList);

  // Function to handle accordion state
  const handleOpenAccordion = (value) => {
    setOpenAccordion(openAccordion === value ? 0 : value);
  };

  // Fetch diet plans for the logged-in user
  useEffect(() => {
    const fetchDietPlans = async () => {
      if (!userId) return;

      try {
        const q = query(
          collection(db, "diet_AI"),
          where("userIdCl", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        const plans = [];

        querySnapshot.forEach((doc) => {
          plans.push({ id: doc.id, ...doc.data() });
        });
        console.log("plans", plans);
        setDietPlans(plans);
        const extractedDietList = plans.length > 0 ? Object.values(plans[0]).filter((item) => typeof item === "object") : [];
        setDietList(extractedDietList);

        // If plans exist, calculate macro data
        if (plans.length > 0) {
          calculateMacros(extractedDietList); // Pass dietList here
        }
      } catch (error) {
        console.error("Error fetching diet plans:", error);
      }
    };

    fetchDietPlans();
  }, [userId]);

  // Calculate macros from diet plan
  const calculateMacros = (dietList) => {
    if (!dietList || dietList.length === 0) {
      return;
    }

    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let calculatedTotalCalories = 0;

    dietList.forEach((meal) => {
      // Parse macros from strings like "50g" to numbers
      const carbs = parseInt(meal.carbs) || 0;
      const protein = parseInt(meal.protein) || 0;
      const fat = parseInt(meal.fats) || 0;

      totalCarbs += carbs;
      totalProtein += protein;
      totalFat += fat;

      // Approximate calories: 4 calories per gram of protein and carbs, 9 per gram of fat
      calculatedTotalCalories += protein * 4 + carbs * 4 + fat * 9;
    });

    const dailyTargets = {
      calories: 2500,
      carbs: 300,
      protein: 150,
      fat: 80,
    };

    // Update State with Planned Values
    setTotalCaloriesPlanned(calculatedTotalCalories);
    setCaloriesLeft(dailyTargets.calories - calculatedTotalCalories);
    setMacrosLeft({
      carbs: dailyTargets.carbs - totalCarbs,
      protein: dailyTargets.protein - totalProtein,
      fat: dailyTargets.fat - totalFat,
    });

    setMacroData([
      { name: "Carbs", value: totalCarbs, color: "#FF6384" },
      { name: "Protein", value: totalProtein, color: "#36A2EB" },
      { name: "Fat", value: totalFat, color: "#FFCE56" },
    ]);
  };

  // Generate week days
  const generateWeekDays = () => {
    const startDay = startOfWeek(selectedDate);
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(startDay, i);
      weekDays.push(day);
    }

    return weekDays;
  };

  const weekDays = generateWeekDays();

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden ">
        <div className="p-4 text-tprimary sticky-top">
          <h1 className="text-2xl font-bold">My Diet Plan</h1>
        </div>

        <div className="bg-white shadow-md">
          <WeeklyCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            _weekDays={weekDays}
          ></WeeklyCalendar>

          {/* Macro Tracker */}
          <MacroTracker
            macroData={macroData}
            caloriesLeft={caloriesLeft}
            macrosLeft={macrosLeft}
            totalCaloriesPlanned={totalCaloriesPlanned} // Rename prop
            plannedCarbs={300}
            plannedProtein={150}
            plannedFat={80}
          />
        </div>

        {/* Planned Meals Section */}
        <div className="p-4 mt-2">
          <h2 className="mb-3 text-lg font-semibold text-gray-700">
            Planned Meals
          </h2>
          {dietList?.length > 0 && (
            <PlannedMeal
              openAccordion={openAccordion}
              dietList={dietList}
              handleOpenAccordion={handleOpenAccordion}
            />
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default MyDiet;