'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { Toaster } from 'sonner';
import { useEffect, useCallback, useRef } from 'react';

function AutoLogout() {
    const { status } = useSession();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // 5 minutes = 5 * 60 * 1000 = 300000 ms
        if (status === 'authenticated') {
            timeoutRef.current = setTimeout(() => {
                signOut();
            }, 300000);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') {
            resetTimer();

            const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
            
            const handleUserActivity = () => {
                resetTimer();
            };

            events.forEach(event => {
                window.addEventListener(event, handleUserActivity);
            });

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                events.forEach(event => {
                    window.removeEventListener(event, handleUserActivity);
                });
            };
        }
    }, [status, resetTimer]);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AutoLogout />
            {children}
            <Toaster position="top-right" richColors />
        </SessionProvider>
    );
}
