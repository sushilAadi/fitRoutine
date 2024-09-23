'use client'
import React from 'react'
import Offcanvas from 'react-bootstrap/Offcanvas';

const OffCanvasComp = ({show, handleClose,customStyle, children, ...props}) => {
  return (
    <Offcanvas className={`${customStyle}`} show={show} onHide={handleClose} {...props}>
        <Offcanvas.Body className='m-0 p-0'>
          {children}
        </Offcanvas.Body>
      </Offcanvas>
  )
}

export default OffCanvasComp