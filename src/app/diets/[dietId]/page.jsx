'use client'
import React, { useEffect, useState, useContext } from "react"; // Correct useContext import
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import { db } from "@/firebase/firebaseConfig";
import { startOfWeek, addDays, isAfter, isBefore, format, parseISO, isSameDay } from "date-fns";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import MacroTracker from "@/Feature/MyDiet/MacroTracker";
import PlannedMeal from "@/Feature/MyDiet/PlannedMeal";
import WeeklyCalendar from "@/Feature/MyDiet/WeeklyCalendar";
import _ from "lodash";

const DietDetail = ({ params }) => {
  const { userDetailData, userId } = useContext(GlobalContext);
  const [dietPlan, setDietPlan] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dietActive, setDietActive] = useState(true);  // New state to track if the diet is active
  const [expiryMessage, setExpiryMessage] = useState("");

  // Get the dietId from params if available
  const dietId = params?.dietId ? decodeURIComponent(params.dietId) : null;

  // Function to handle accordion state
  const handleOpenAccordion = (value) => {
    setOpenAccordion(openAccordion === value ? 0 : value);
  };

  // Function to check diet plan expiry
  const checkDietExpiry = (plan) => {
      if (!plan || !plan.activeDate || !plan.totalWeeks) {
          return;  // or handle the case where activeDate or totalWeeks is missing
      }

      const startDate = parseISO(plan.activeDate);
      const endDate = addDays(startDate, plan.totalWeeks * 7);

      if (isAfter(new Date(), endDate)) {
          setDietActive(false);
          setExpiryMessage(`Your diet plan "${plan.planName}" expired on ${format(endDate, 'MMMM dd, yyyy')}.`);
          return false;
      } else {
          setDietActive(true);
          setExpiryMessage("");
          return true;
      }
  };

  // Fetch specific diet plan by ID or all diet plans for the user
  useEffect(() => {
    const fetchDietPlan = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        let plan = null;
        
        if (dietId) {
          // Fetch specific diet plan by ID
          const docRef = doc(db, "diet_AI", dietId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            plan = { id: docSnap.id, ...docSnap.data() };
            
            // Check if the plan belongs to the current user for security
            if (plan.userIdCl === userId) {
               // Check diet expiry before setting dietPlan
              if (checkDietExpiry(plan)) {
                setDietPlan(plan);

                // Extract diet list from the plan
                const extractedDietList = Object.values(plan).filter(
                    (item) => typeof item === "object" && item !== null && !Array.isArray(item)
                );
                setDietList(extractedDietList);

                // Calculate macros
                calculateMacros(extractedDietList);
              }
            } else {
              setError("You don't have permission to view this diet plan.");
            }
          } else {
            setError("Diet plan not found.");
          }
        } else {
          // Fetch all diet plans for the logged-in user
          const q = query(
            collection(db, "diet_AI"),
            where("userIdCl", "==", userId)
          );
          
          const querySnapshot = await getDocs(q);
          const plans = [];
          
          querySnapshot.forEach((doc) => {
            plans.push({ id: doc.id, ...doc.data() });
          });
          
          if (plans.length > 0) {
             // Check diet expiry before setting dietPlan
            if (checkDietExpiry(plans[0])) {
              setDietPlan(plans[0]);

              // Extract diet list from the first plan
              const extractedDietList = Object.values(plans[0]).filter(
                (item) => typeof item === "object" && item !== null && !Array.isArray(item)
              );
              setDietList(extractedDietList);

              // Calculate macros
              calculateMacros(extractedDietList);
            }
          } else {
            setError("No diet plans found.");
          }
        }
      } catch (error) {
        console.error("Error fetching diet plan:", error);
        setError("Error loading diet plan. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDietPlan();
  }, [userId, dietId]);

  console.log("dietPlan",dietPlan)

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

  // Custom hook to generate week days based on activeDate and totalWeeks
  const useDietWeekDays = (activeDate, totalWeeks) => {
    const [weekDays, setWeekDays] = useState([]);

    useEffect(() => {
      if (activeDate && totalWeeks) {
        const startDate = parseISO(activeDate);
        const endDate = addDays(startDate, totalWeeks * 7); // Calculate end date of the diet plan

        const generateWeek = (currentDate) => {
          const startDay = startOfWeek(currentDate);
          const week = [];

          for (let i = 0; i < 7; i++) {
            const day = addDays(startDay, i);

            // Only add dates that are within the diet plan's duration
            if (isAfter(day, startDate) || isSameDay(day, startDate)) {
              if (isBefore(day, endDate) || isSameDay(day, endDate)) {
                week.push(day);
              }
            }
          }

          return week;
        };

        // Generate week days starting from activeDate
        const generatedWeekDays = generateWeek(startDate);
        setWeekDays(generatedWeekDays);
      }
    }, [activeDate, totalWeeks]);

    return weekDays;
  };

  const weekDays = useDietWeekDays(dietPlan?.activeDate, dietPlan?.totalWeeks);

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="p-4 text-tprimary sticky-top">
          <h1 className="text-2xl font-bold">
            {dietId ? `Diet Plan: ${_.capitalize(dietPlan?.planName) || dietId}` : "My Diet Plan"}
          </h1>
        </div>

        <div className="mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>Loading diet plan...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-red-700 bg-red-100 border border-red-400 rounded">
              <p>{error}</p>
            </div>
          ) : (
            <>
               {expiryMessage && (
                    <div className="p-4 text-yellow-700 bg-yellow-100 border border-yellow-400 rounded">
                        <p>{expiryMessage}</p>
                    </div>
                )}

                {dietActive ? (
                  <>
                <div className="bg-white shadow-md">
                <WeeklyCalendar
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  weekDays={weekDays}
                  activeDate={dietPlan?.activeDate}
                  totalWeeks={dietPlan?.totalWeeks}
                />

                {/* Macro Tracker */}
                <MacroTracker
                  macroData={macroData}
                  caloriesLeft={caloriesLeft}
                  macrosLeft={macrosLeft}
                  totalCaloriesPlanned={totalCaloriesPlanned}
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
                {dietList?.length > 0 ? (
                  <PlannedMeal
                    openAccordion={openAccordion}
                    dietList={dietList}
                    handleOpenAccordion={handleOpenAccordion}
                    userId={userId}
                    selectedDate={selectedDate}
                    dietId={dietId}
                    activeDate={dietPlan?.activeDate}
                    totalWeeks={dietPlan?.totalWeeks}
                  />
                ) : (
                  <p>No meals planned for this diet.</p>
                )}
              </div>
             </>
               ) : (
                        <div className="p-4 text-gray-700 bg-gray-100 border border-gray-400 rounded">
                            <p>Your diet plan has expired.</p>
                        </div>
                    )}
            </>
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default DietDetail;