// components/DraftPlansNav.js
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "@/firebase/firebaseConfig";
import { useRouter } from 'next/navigation';

const DraftPlansNav = () => {
  const { user } = useUser();
  const { id } = user || {};
  const router = useRouter();
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch draft count
  const fetchDraftCount = async () => {
    if (!id) return;
    
    try {
      const q = query(
        collection(db, 'workoutDrafts'),
        where('userIdCl', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      setDraftCount(querySnapshot.size);
      
    } catch (error) {
      console.error('Error fetching draft count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftCount();
  }, [id]);

  if (loading || draftCount === 0) {
    return null;
  }

  return (
    <div className="fixed z-50 bottom-4 right-4">
      <button
        onClick={() => router.push('/draft')}
        className="flex items-center gap-2 px-4 py-3 text-white transition-all duration-300 bg-yellow-500 rounded-full shadow-lg hover:bg-yellow-600 hover:scale-105"
      >
        <i className="fa-regular fa-file-lines"></i>
        <span className="font-medium">Drafts</span>
        <span className="px-2 py-1 text-xs font-bold text-yellow-600 bg-white rounded-full">
          {draftCount}
        </span>
      </button>
    </div>
  );
};

export default DraftPlansNav;