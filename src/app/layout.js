'use client';

import GlobalContextProvider from "@/context/GloablContext";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@material-tailwind/react";

const queryClient = new QueryClient();


export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
    <html lang="en">
      <body >
        <ThemeProvider>
      <GlobalContextProvider>
      <nav className="mb-8 fixed top-0 left-0 right-0 z-10 bg-gray-300 w-full">
        <ul className="flex space-x-4">
          <li>
            <a href="/" className="text-blue-600 hover:text-blue-800">Home</a>
          </li>
          <li>
            <a href="/bodyparts" className="text-blue-600 hover:text-blue-800">Body Parts</a>
          </li>
          <li>
            <a href="/equipment" className="text-blue-600 hover:text-blue-800">Equipment</a>
          </li>
          <li>
            <a href="/exercise" className="text-blue-600 hover:text-blue-800">Exercises</a>
          </li>
          <li>
            <a href="/bodyTarget" className="text-blue-600 hover:text-blue-800">Body Target</a>
          </li>
          <li>
            <a href="/customPlan" className="text-blue-600 hover:text-blue-800">Custom Plan</a>
          </li>
        </ul>
      </nav>
        {children}
      </GlobalContextProvider>
      </ThemeProvider>
      </body>
    </html>
    </QueryClientProvider>
  );
}
