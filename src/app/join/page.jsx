'use client'
import SecureComponent from '@/components/SecureComponent/[[...SecureComponent]]/SecureComponent'
import React, { useContext, useEffect, useState } from 'react'
import { Pencil } from 'lucide-react';
import { useAuth,useUser } from '@clerk/nextjs';
import { GlobalContext } from '@/context/GloablContext';
import ButtonCs from '@/components/Button/ButtonCs';
import _ from 'lodash';
import { supabase } from '@/createClient';




const MentorRegistration = () => {


  

  
  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0 p-3 sticky-top !-z-[999999]"></div>

        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
        
        </div>
      </div>
    </SecureComponent>
  )
}

export default MentorRegistration