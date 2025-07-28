'use client'
import React, { useEffect, useState } from 'react'
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SecureComponent = ({ children }) => {
    const { isSignedIn, isLoaded } = useAuth();
    const [hasRedirected, setHasRedirected] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn && !hasRedirected) {
            router.push('/');
            setHasRedirected(true);
        }
    }, [isSignedIn, isLoaded, hasRedirected]);

    return (
        <>
            <SignedIn>
                {children}
            </SignedIn>
            <SignedOut>
                <Link href="/">Plz login to Continue</Link>
            </SignedOut>
        </>
    )
}

export default SecureComponent