"use client";

import GlobalContextProvider from "@/context/GloablContext";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@material-tailwind/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "bootstrap/dist/css/bootstrap.min.css";
import OffCanvasComp from "@/components/OffCanvas/OffCanvasComp";
import { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import NavbarComponent from "@/components/Navbar/Navbar";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import "animate.css";
import { Toaster } from 'react-hot-toast';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css"; 

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <ClerkProvider publishableKey={key}>
      <QueryClientProvider client={queryClient}>
        <GlobalContextProvider>
        <PrimeReactProvider>
          <html lang="en" suppressHydrationWarning>
            <head>
            <link rel="manifest" href="/manifest.json" />
              <link
                rel="stylesheet"
                href="https://site-assets.fontawesome.com/releases/v6.6.0/css/all.css"
              />

              <link
                rel="stylesheet"
                href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-duotone-solid.css"
              />

              <link
                rel="stylesheet"
                href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-thin.css"
              />

              <link
                rel="stylesheet"
                href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-solid.css"
              />

              <link
                rel="stylesheet"
                href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-regular.css"
              />

              <link
                rel="stylesheet"
                href="https://site-assets.fontawesome.com/releases/v6.6.0/css/sharp-light.css"
              />
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="true"
              />
              <link
                href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                rel="stylesheet"
              />
              <link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Bebas+Neue&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></link>
            </head>
            <body suppressHydrationWarning>
              <ThemeProvider>
                <SignedIn>
                  <OffCanvasComp
                    placement="end"
                    name="sidebar"
                    customStyle="bg-transparent"
                    sidebar={true}
                  >
                    <Sidebar />
                  </OffCanvasComp>
                  
                  {/* Global Hamburger Menu - Fixed Position */}
                  <div className="fixed top-4 right-4 z-[999999] lg:top-6 lg:right-6">
                    {<NavbarComponent />}
                  </div>
                </SignedIn>
                <main className="min-h-screen">
                  {children}
                </main>
                <Toaster/>
              </ThemeProvider>
              <Analytics />
              <SpeedInsights />
            </body>
          </html>
          </PrimeReactProvider>
        </GlobalContextProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
