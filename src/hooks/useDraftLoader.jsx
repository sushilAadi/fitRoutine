// hooks/useDraftLoader.js
import { useEffect } from 'react';

export const useDraftLoader = ({
  setPlanName,
  setWeeks,
  setDaysPerWeek,
  setWorkoutPlan,
  setExerciseHistory,
  setWeekNames,
  setDayNames,
  setIsChecked,
  setIsDraft,
  setIsEditingExistingPlan,
  setToggleForm
}) => {
  useEffect(() => {
    // Check if we're editing a draft
    const editingDraft = sessionStorage.getItem('editingDraft');
    
    if (editingDraft) {
      try {
        const draft = JSON.parse(editingDraft);
        
        // Load draft data into state
        setPlanName(draft.name);
        setWeeks(draft.weeks);
        setDaysPerWeek(draft.daysPerWeek);
        setWorkoutPlan(draft.workoutPlan);
        setExerciseHistory(draft.exerciseHistory || {});
        setWeekNames(draft.weekNames || []);
        setDayNames(draft.dayNames || []);
        setIsChecked(draft.setUpdate);
        setIsDraft(true);
        setIsEditingExistingPlan(true);
        setToggleForm(false); // Skip the form and go directly to plan editing
        
        // Clear the session storage after loading
        sessionStorage.removeItem('editingDraft');
        
      } catch (error) {
        console.error('Error loading draft:', error);
        sessionStorage.removeItem('editingDraft');
      }
    }
  }, []);
};