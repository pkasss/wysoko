import {auth} from "@/src/lib/auth";

import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getSafeRedirect} from "@/src/lib/redirects";
import {UserDataForm} from "@/src/components/UserDataForm";

export default async function Welcome({
    searchParams,
} : {
    searchParams: Promise<{next?: string}>;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {next} = await searchParams;
    const callbackURL = getSafeRedirect(next);

    if (!session) {
        redirect("/login");
    }

    if (session.user.name) {
        redirect(callbackURL);
    }

    return (
        <main className="flex min-h-dvh items-center justify-center p-4">
            <UserDataForm callbackURL={callbackURL}/>
        </main>
    )
}