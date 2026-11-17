'use client';

import {useRouter} from "next/navigation";
import {useEffect} from "react";


const REFRESH_INTERVAL = 30000;



export function AutoRefresh() {
    const router = useRouter();

    useEffect(() => {
        function handleVisibility() {
            if (document.visibilityState === 'visible') {
                router.refresh();
            }
        }

        const id = setInterval(handleVisibility, REFRESH_INTERVAL);

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", handleVisibility);
        }
    }, [router]);

    return null;
}