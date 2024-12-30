"use client";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import React, { useContext, useEffect, useState } from "react";

import ButtonCs from "@/components/Button/ButtonCs";
import { supabase } from "@/createClient";
import InputBlk from "@/components/InputCs/InputBlk";
import { Col, Row } from "react-bootstrap";

const MentorRegistration = () => {
  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden text-white bg-tprimary">
        <div className="top-0 p-3 sticky-top">
          <p className="text-xl">Join</p>
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          <form>
            <InputBlk
              title="Full Name"
              name="name"
              placeholder="Enter Your Full Name"
            />
            <br />
            <Row>
              <Col xs={6}>
                <InputBlk title="Mobile Number" name="mobile" placeholder="+91 9000012345" type="number"/>
              </Col>
              <Col xs={6}>
                <InputBlk title="Whatsapp Number" name="whatsapp" placeholder="+91 9000012345"/>
              </Col>
              
              <Col xs={6}>
              <br/>
                <InputBlk title="Alternate Number" name="alternateNumber" placeholder="+91 9000012345"/>
              </Col>
            </Row>
          </form>
        </div>
      </div>
    </SecureComponent>
  );
};

export default MentorRegistration;
