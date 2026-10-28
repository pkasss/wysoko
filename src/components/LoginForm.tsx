'use client';

import {authClient} from "@/src/lib/auth-client";
import {SubmitEvent, useState} from "react";

import {
    Field,
    FieldDescription,
    FieldLabel,
    FieldError
} from "@/src/components/ui/field";
import {Input} from "@/src/components/ui/input";
import {Button} from "@/src/components/ui/button";

type LoginStatus = 'idle' | 'sending' | 'sent' | 'error';

export function LoginForm({
    callbackURL,
} : {
    callbackURL: string;
}) {
    const [mail, setMail] = useState("");
    const [status, setStatus] = useState<LoginStatus>('idle');

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        setStatus('sending');

        const {error} = await authClient.signIn.magicLink({
            email: mail,
            callbackURL,
            newUserCallbackURL: `/welcome?next=${encodeURIComponent(callbackURL)}`,
            errorCallbackURL: "/error"
        });

        if (error) {
            setStatus('error');
        } else {
            setStatus('sent');
        }
    }

    if (status === 'sent') {
        return (
            <div>
                <h1>wysłaliśmy wiadomość na {mail}.</h1>
                <Button
                    variant={"outline"}
                    onClick={() => {setStatus('idle')}}
                >
                    wpisz inny mail
                </Button>
            </div>
        )
    }

    return (
        <form className={"w-full max-w-sm"} onSubmit={handleSubmit}>
            <FieldLabel htmlFor={"email"}>podaj maila.</FieldLabel>
            <Field>
                <Input
                    id={"email"}
                    type={"email"}
                    required
                    placeholder={"example@mail.com"}
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                />
                <FieldDescription>na podany adres otrzymasz maila z linkiem do logowania.</FieldDescription>
            </Field>
            <Button
                type={"submit"}
                variant={"outline"}
                disabled={status === 'sending'}
            >
                {status === 'sending' ? "wysyłanie..." : "kontynuuj"}
            </Button>
            {status === 'error' &&
                <FieldError>
                    nie udało się wysłać linku, spróbuj ponownie.
                </FieldError>
            }
        </form>
    );
}