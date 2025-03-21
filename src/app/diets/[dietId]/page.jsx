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
  const { userId } = useContext(GlobalContext);
  const [dietPlan, setDietPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openAccordion, setOpenAccordion] = useState(1);
  const [dietList, setDietList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dietActive, setDietActive] = useState(true);  // New state to track if the diet is active
  const [expiryMessage, setExpiryMessage] = useState("");
  const [plannedCarbs, setPlannedCarbs] = useState(0);
  const [plannedProtein, setPlannedProtein] = useState(0);
  const [plannedFat, setPlannedFat] = useState(0);

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
                calculateMacros(plan);
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
              calculateMacros(plans[0]);
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



  // Calculate macros from diet plan
  const calculateMacros = (dietPlan) => {
    if (!dietPlan) {
      return;
    }
    let carbs = 0;
    let protein = 0;
    let fat = 0;

    for (const key in dietPlan) {
      if (typeof dietPlan[key] === 'object' && dietPlan[key] !== null) {
        carbs += parseInt(dietPlan[key].carbs) || 0;
        protein += parseInt(dietPlan[key].protein) || 0;
        fat += parseInt(dietPlan[key].fats) || 0;
      }
    }
      setPlannedCarbs(carbs);
      setPlannedProtein(protein);
      setPlannedFat(fat);
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
  const [refetchFunction, setRefetchFunction] = useState(null);
  const handleRefetch = () => {
    if (refetchFunction) {
      refetchFunction(); // Call the function from state
     
    }
  };


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
                  totalCaloriesPlanned={dietPlan?.totalCaloriesRequied}
                  plannedCarbs={plannedCarbs}
                  plannedProtein={plannedProtein}
                  plannedFat={plannedFat}
                  dietId={dietId}
                  userId={userId}
                  selectedDate={selectedDate}
                  handleRefetch={setRefetchFunction}
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
                    handleRefetch={handleRefetch}
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