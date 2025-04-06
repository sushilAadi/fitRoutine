import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "@firebase/firestore";

export const handleStatus = async (planId,progressStats) => {
    try {
      if (!planId) throw new Error("Plan ID is missing.");
  
      const userProgressRef = doc(db, "workoutPlans", planId);
  
      await updateDoc(userProgressRef, {
        "workoutPlanDB.progress": +progressStats?.effectiveCompletionPercent,
        "workoutPlanDB.progressData": progressStats,
      });
  
      console.log("Status updated successfully!");
      // Optionally show a toast or UI message
      // toast.success("Status updated!");
    } catch (error) {
      console.error("Error updating status:", error.message);
      // Optionally show a toast or UI message
      // toast.error("Failed to update status");
    }
  };