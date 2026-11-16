import {auth} from "@/src/lib/auth";

import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getSafeRedirect} from "@/src/lib/redirects";
import {LoginForm} from "@/src/components/LoginForm";

export default async function Login({
    searchParams,
} : {
    searchParams: Promise<{next?: string, error?: string}>;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {next, error} = await searchParams;
    const callbackURL = getSafeRedirect(next);

    if (session) {
        redirect(callbackURL);
    }

    return (
        <main className="flex min-h-dvh items-center justify-center p-4">
            <LoginForm callbackURL={callbackURL} linkExpired={error === 'link'}/>
        </main>
    )
}