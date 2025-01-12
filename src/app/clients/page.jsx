'use client'
import React, { useEffect, useState, useContext } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

import { GlobalContext } from '@/context/GloablContext';
import SecureComponent from '@/components/SecureComponent/[[...SecureComponent]]/SecureComponent';
import { Card } from 'react-bootstrap';
import { db } from '@/firebase/firebaseConfig';
import ClientCard from '@/Feature/Clients/ClientCard';




const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userDetailData } = useContext(GlobalContext);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Query clients collection where mentorId matches current mentor's ID
        const clientsRef = collection(db, 'enrollments');
        const q = query(clientsRef, where('mentorIdCl', '==', userDetailData?.userIdCl));
        const snapshot = await getDocs(q);
        
        const clientsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setClients(clientsList);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userDetailData?.userIdCl) {
      fetchClients();
    }
  }, [userDetailData]);

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden bg-tprimary">
        <div className="top-0 p-6 text-white bg-tprimary sticky-top z-1">
          <h1 className="text-3xl font-bold">My Clients</h1>
          <p className="mt-2 text-gray-300">Manage and track your client progress</p>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="text-center text-white">Loading clients...</div>
          ) : clients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map(client => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white bg-gray-800 rounded-lg">
              <h3 className="text-xl font-semibold">No Clients Yet</h3>
              <p className="mt-2 text-gray-300">When clients enroll with you, they'll appear here.</p>
            </div>
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default Clients;