import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {auth} from "@/src/lib/auth";
import {LoginForm} from "@/src/components/LoginForm";

export default async function Login() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) {
        redirect("/");
    }

    return (
        <main className="flex min-h-dvh items-center justify-center p-4">
            <LoginForm/>
        </main>
    )
}