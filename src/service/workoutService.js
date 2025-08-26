import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export const handleStatus = async (planId, progressStats) => {
    try {
      if (!planId) {
        throw new Error("Plan ID is missing.");
      }
      
      if (!db) {
        throw new Error("Firebase database not initialized.");
      }
      
      if (!progressStats) {
        console.warn("No progress stats provided to handleStatus");
        return;
      }
  
      const userProgressRef = doc(db, "workoutPlans", planId);
      
      const updateData = {
        "workoutPlanDB.progress": Number(progressStats?.effectiveCompletionPercent) || 0,
        "workoutPlanDB.progressData": progressStats,
        "workoutPlanDB.lastAccessed": new Date().toISOString()
      };
  
      await updateDoc(userProgressRef, updateData);
  
      console.log("Status updated successfully!", {
        planId,
        progress: updateData["workoutPlanDB.progress"]
      });
    } catch (error) {
      console.error("Error updating status:", error.message || error);
      console.error("Full error:", error);
    }
  };