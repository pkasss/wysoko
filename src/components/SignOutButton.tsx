'use client';

import {authClient} from "@/src/lib/auth-client";
import {useRouter} from "next/navigation";
import {useState} from "react";

export function SignOutButton({slug, className}: { slug: string, className?: string }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function handleClick() {
        setPending(true);

        const {error} = await authClient.signOut();
        if (error) {
            setPending(false);
            return;
        }

        router.push(`/zawody/${slug}`);
        router.refresh();
    }

    return (
        <button
            type={'button'}
            className={className}
            onClick={handleClick}
            disabled={pending}
        >
            {pending ? 'Wylogowywanie...' : 'Wyloguj się'}
        </button>
    )
}