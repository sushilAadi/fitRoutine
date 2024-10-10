'use client';

import GlobalContextProvider from "@/context/GloablContext";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@material-tailwind/react";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import 'bootstrap/dist/css/bootstrap.min.css';
import OffCanvasComp from "@/components/OffCanvas/OffCanvasComp";
import { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import Image from "next/image";
import logo from "@/assets/logo.jpg";
import NavbarComponent from "@/components/Navbar/Navbar";

const queryClient = new QueryClient();


export default function RootLayout({ children }) {
  const [show, setShow] = useState(false);

  const handleOpenClose = () => setShow(!show);

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en">
        <head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
            integrity="sha512-..."
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin/>
<link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"/>
        </head>
        <body >
          <ThemeProvider>
            <GlobalContextProvider>
              <OffCanvasComp placement="end" name="sidebar" show={show} handleClose={handleOpenClose} customStyle="bg-transparent">
                <Sidebar setOpenNav={handleOpenClose}/>
              </OffCanvasComp>
              <div>
                
                <NavbarComponent setOpenNav={handleOpenClose}/>
              </div>
              {children}
            </GlobalContextProvider>
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </QueryClientProvider>
  );
}
