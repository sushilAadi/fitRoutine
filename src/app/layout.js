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
