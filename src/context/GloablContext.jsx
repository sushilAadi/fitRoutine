"use client";

import { createContext, useMemo, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

import _ from "lodash";
import { calculateAge } from "@/utils";
import { db } from "@/firebase/firebaseConfig";

export const GlobalContext = createContext("");

export default function GlobalContextProvider({ children }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
 

  const userRole = user?.publicMetadata?.role ?? "user";

  const [userDetail, setUserDetail] = useState(null);
  const [userWeightData, setUserWeightData] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isFetchingWeight, setIsFetchingWeight] = useState(false);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);

  const [gender, setGender] = useState(null);
  const [weight, setWeight] = useState(50);
  const [height, setHeight] = useState(152);
  const [age, setAge] = useState(null);
  const [selectedGoals, setSelectedGoals] = useState(new Set([]));
  const [activityLevel, setActivityLevel] = useState(null);
  const [show, setShow] = useState(false);
  const [dietPlans, setDietPlans] = useState([]);

  const fetchUserDetail = async () => {
    try {
      setIsFetchingUser(true);
      
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        
        setUserDetail(userDoc.data());
      } else {
        
        setUserDetail(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsFetchingUser(false);
    }
  };

  const fetchUserWeight = async () => {
    try {
      setIsFetchingWeight(true);
      
      const weightCollectionRef = collection(db, "weight");
      const weightQuery = query(weightCollectionRef, where("userIdCl", "==", userId));
      const weightDocs = await getDocs(weightQuery);
      const data = weightDocs.docs.map((doc) => doc.data());
      
      setUserWeightData(data);
    } catch (error) {
      console.error("Error fetching weight details:", error);
    } finally {
      setIsFetchingWeight(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setIsFetchingPlans(true);
      
      const plansCollectionRef = collection(db, "workoutPlans");
      const plansQuery = query(plansCollectionRef, where("userIdCl", "==", userId));
      const plansDocs = await getDocs(plansQuery);
      const plansData = plansDocs.docs.map((doc) => ({...doc.data(), id: doc.id}));
      
      setPlans(plansData);
    } catch (error) {
      console.error("Error fetching plans context:", error);
    } finally {
      setIsFetchingPlans(false);
    }
  };

  const fetchDietPlans = async () => {
    if (userId) {
      try {
        const dietCollectionRef = collection(db, 'diet_AI');
        const q = query(dietCollectionRef, where("userIdCl", "==", userId)); 
        const querySnapshot = await getDocs(q);

        const dietPlansData = [];
        querySnapshot.forEach((doc) => {
          dietPlansData.push({ id: doc.id, ...doc.data() });
        });

        setDietPlans(dietPlansData);
      } catch (error) {
        console.error("Error fetching diet plans:", error);
      }
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
      fetchUserWeight();
      fetchPlans();
    }
  }, [userId]);

  const userRefetch = fetchUserDetail;
  const userWeightRefetch = fetchUserWeight;
  const plansRefetch = fetchPlans;

  const userDetailData = userDetail || {};
  
  const userAgeCal = calculateAge(userDetailData?.userBirthDate);

  const handleOpenClose = () => setShow(!show);
  const latestWeight = _.maxBy(userWeightData, (entry) => new Date(entry?.created_at));

  const isFetching = isFetchingUser || isFetchingWeight || isFetchingPlans;

  const contextValue = useMemo(() => {
    return {
      user,
      gender,
      setGender,
      weight,
      setWeight,
      height,
      setHeight,
      age,
      setAge,
      userDetailData,
      userRefetch,
      handleOpenClose,
      show,
      selectedGoals,
      setSelectedGoals,
      activityLevel,
      setActivityLevel,
      userWeightRefetch,
      plansRefetch,
      latestWeight,
      plans,
      userId,
      userAgeCal,
      isFetching,
      fetchDietPlans,
      dietPlans, setDietPlans
    };
  }, [
    gender,
    weight,
    height,
    age,
    userDetailData,
    show,
    selectedGoals,
    activityLevel,
    latestWeight,
    plans,
    userAgeCal,
    isFetching,
    dietPlans
    
  ]);

  return <GlobalContext.Provider value={contextValue}>{children}</GlobalContext.Provider>;
}
