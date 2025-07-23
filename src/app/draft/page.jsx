"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@clerk/clerk-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';
import ButtonCs from "@/components/Button/ButtonCs";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";

const DraftPlansPage = () => {
  const { user } = useUser();
  const { id } = user || {};
  const router = useRouter();
  const [draftPlans, setDraftPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  
  const fetchDraftPlans = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'workoutDrafts'),
        where('userIdCl', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      const drafts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const workoutPlanDB = data.workoutPlanDB;
        
        // Parse the saved data
        const parsedPlan = {
          id: doc.id,
          name: workoutPlanDB.name,
          weeks: JSON.parse(workoutPlanDB.weeks),
          daysPerWeek: JSON.parse(workoutPlanDB.daysPerWeek),
          workoutPlan: JSON.parse(workoutPlanDB.workoutPlan),
          exerciseHistory: JSON.parse(workoutPlanDB.exerciseHistory || '{}'),
          weekNames: JSON.parse(workoutPlanDB.weekNames || '[]'),
          dayNames: JSON.parse(workoutPlanDB.dayNames || '[]'),
          date: workoutPlanDB.date,
          setUpdate: workoutPlanDB.setUpdate,
          isDraft: workoutPlanDB.isDraft,
          planName: data.planName
        };
        
        drafts.push(parsedPlan);
      });
      
      // Sort by date (newest first)
      drafts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setDraftPlans(drafts);
      
    } catch (error) {
      console.error('Error fetching draft plans:', error);
      toast.error('Error loading draft plans');
    } finally {
      setLoading(false);
    }
  };

  // Delete a draft plan
  const deleteDraftPlan = async (draftId, planName) => {
    if (!window.confirm(`Are you sure you want to delete "${planName}"?`)) {
      return;
    }
    
    try {
      setDeletingId(draftId);
      await deleteDoc(doc(db, 'workoutDrafts', draftId));
      
      // Remove from local state
      setDraftPlans(prev => prev.filter(plan => plan.id !== draftId));
      toast.success('Draft deleted successfully');
      
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Error deleting draft');
    } finally {
      setDeletingId(null);
    }
  };

  // Continue editing a draft plan
  const continueDraft = (draft) => {
    // Store the draft data in sessionStorage to pass to create plan page
    sessionStorage.setItem('editingDraft', JSON.stringify(draft));
    router.push('/createPlanPage');
  };

  // Calculate completion percentage
  const calculateCompletion = (workoutPlan, daysPerWeek) => {
    if (!workoutPlan || workoutPlan.length === 0) return 0;
    
    let totalDays = 0;
    let daysWithExercises = 0;
    
    workoutPlan.forEach(week => {
      week.forEach(day => {
        totalDays++;
        if (day.exercises && day.exercises.length > 0) {
          daysWithExercises++;
        }
      });
    });
    
    return totalDays > 0 ? Math.round((daysWithExercises / totalDays) * 100) : 0;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchDraftPlans();
  }, [id]);

  if (loading) {
    return (
      <SecureComponent>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-black rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your drafts...</p>
          </div>
        </div>
      </SecureComponent>
    );
  }

  return (
    <SecureComponent>
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Draft Plans</h1>
            <p className="text-gray-600">Continue working on your unfinished workout plans</p>
          </div>

          {draftPlans.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full">
                <i className="text-3xl text-gray-400 fa-regular fa-file-lines"></i>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-700">No Draft Plans</h3>
              <p className="mb-6 text-gray-500">You haven't saved any draft plans yet.</p>
              
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {draftPlans.map((draft) => {
                const completionPercentage = calculateCompletion(draft.workoutPlan, draft.daysPerWeek);
                
                return (
                  <div key={draft.id} className="p-6 transition-shadow bg-white rounded-lg shadow-md hover:shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {draft.name}
                      </h3>
                      <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">
                        Draft
                      </span>
                    </div>
                    
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Duration:</span>
                        <span>{draft.weeks} weeks</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Days/Week:</span>
                        <span>{draft.daysPerWeek} days</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Completion:</span>
                        <span className={`font-medium ${completionPercentage > 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {completionPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 mb-4 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          completionPercentage > 50 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="mb-4 text-xs text-gray-500">
                      Last edited: {formatDate(draft.date)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => continueDraft(draft)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-black rounded hover:bg-gray-800"
                      >
                        Continue Editing
                      </button>
                      <button
                        onClick={() => deleteDraftPlan(draft.id, draft.name)}
                        disabled={deletingId === draft.id}
                        className="px-3 py-2 text-sm text-red-600 transition-colors rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === draft.id ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fa-regular fa-trash"></i>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <ButtonCs
              title="Create New Plan"
              onClick={() => router.push('/createPlanPage')}
              className="btnStyle"
            />
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default DraftPlansPage;