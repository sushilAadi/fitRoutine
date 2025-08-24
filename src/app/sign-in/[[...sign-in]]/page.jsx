// 'use client'
// import React, { useState } from 'react'
// import { useSignIn, useAuth, SignIn } from '@clerk/nextjs'
// import { useRouter } from 'next/navigation'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import Image from 'next/image'
// import logo from "../../../assets/neeed.jpg"

// const SignIN = () => {
//   const { signIn, isLoaded } = useSignIn()
//   const { isSignedIn } = useAuth()
//   const router = useRouter()
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState('')

//   React.useEffect(() => {
//     if (isSignedIn) {
//       router.push('/')
//     }
//   }, [isSignedIn, router])

//   const handleGoogleSignIn = async () => {
//     if (!isLoaded) return

//     setIsLoading(true)
//     try {
//       await signIn.authenticateWithRedirect({
//         strategy: 'oauth_google',
//         redirectUrl: '/sso-callback',
//         redirectUrlComplete: '/'
//       })
//     } catch (err) {
//       setError(err.errors?.[0]?.message || 'An error occurred during Google sign in')
//       setIsLoading(false)
//     }
//   }

//   if (!isLoaded) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-8 h-8 border-b-2 border-black rounded-full animate-spin"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
//       <div className="w-full max-w-lg space-y-6">
//         {/* Header */}
//         <div className="space-y-2 text-center">
//           <Image
//             src={logo}
//             alt="Logo"
//             width={64}
//             height={64}
//             className="w-16 h-16 mx-auto mb-4 rounded-full"
//           />
//           <h1 className="text-3xl font-bold tracking-tight text-gray-900">
//             Welcome to NEEED Fit
//           </h1>
//           <p className="text-gray-600">
//             Sign in to start your fitness journey
//           </p>
//         </div>

//         {/* Sign In Card */}
//         <Card className="bg-transparent border-0 shadow-none">
//           <CardHeader className="pb-2 text-center">
//             <CardTitle className="text-xl">Sign In</CardTitle>
//             <CardDescription>
//               Choose your preferred sign-in method
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="pt-0">
//             {/* <Button
//               onClick={handleGoogleSignIn}
//               disabled={isLoading}
//               variant="outline"
//               className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
//             >
//               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
//                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//               </svg>
//               Continue with Google
//             </Button> */}
//             <SignIn/>

//             {error && (
//               <div className="mt-4 text-sm text-red-600">{error}</div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Footer */}
//         <div className="text-sm text-center text-gray-500">
//           <p>Secure authentication • Privacy protected</p>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default SignIN

'use client';

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";
import logo from "../../../assets/neeed.jpg";

const page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="space-y-2 text-center">
        <Image
          src={logo}
          alt="Logo"
          width={64}
          height={64}
          className="w-16 h-16 mx-auto mb-4 rounded-full"
        />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome to NEEED Fit
        </h1>
        <p className="mb-4 text-gray-600">Sign in to start your fitness journey</p>
      </div>
      <SignIn />
    </div>
  );
};

export default page;
