'use client'
import { GlobalContext } from '@/context/GloablContext';
import React, { useContext } from 'react'
import Offcanvas from 'react-bootstrap/Offcanvas';

const OffCanvasComp = ({customStyle, children, ...props}) => {
  const {handleOpenClose,show,fullName} = useContext(GlobalContext)
  
  return (
    <Offcanvas className={`${customStyle}`} show={show} onHide={handleOpenClose} {...props}>
        <Offcanvas.Body className='p-0 m-0'>
          {children}
        </Offcanvas.Body>
      </Offcanvas>
  )
}

export default OffCanvasComp