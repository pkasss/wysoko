'use client';

import {authClient} from "@/src/lib/auth-client";

import {SubmitEvent, useState} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/src/components/ui/input";
import {Field, FieldError, FieldLabel} from "@/src/components/ui/field";
import {Button} from "@/src/components/ui/button";

type UpdateStatus = 'idle' | 'sending' | 'error';

export function UserDataForm({
    callbackURL,
} : {
    callbackURL: string;
}) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [status, setStatus] = useState<UpdateStatus>('idle');

    const router = useRouter();

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        setStatus('sending');

        const userName = firstName.trim() + ' ' + lastName.trim();

        const {error} = await authClient.updateUser({
            name: userName
        });

        if (error) {
            setStatus('error');
        } else {
            router.push(callbackURL);
        }
    }

    return (
        <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleSubmit}>
            <h1 className={"text-2xl"}>Cześć{firstName ? ', ' : ''}{ firstName}!</h1>
            <Field className={"w-full"}>
                <FieldLabel htmlFor={"firstName"}>podaj imię.</FieldLabel>
                <Input
                    id={"firstName"}
                    value={firstName}
                    required
                    maxLength={50}
                    title={'tylko litery, bez cyfr i znaków specjalnych.'}
                    placeholder={'Krzysztof'}
                    pattern="\p{L}+([ \-']\p{L}+)*"
                    autoComplete={'given-name'}
                    onChange={(e) => setFirstName(e.target.value)}
                />
            </Field>
            <Field className={"w-full"}>
                <FieldLabel htmlFor={"lastName"}>podaj nazwisko.</FieldLabel>
                <Input
                    id={"lastName"}
                    value={lastName}
                    required
                    title={'tylko litery; nazwiska dwuczłonowe oddziel myślnikiem.'}
                    maxLength={50}
                    placeholder={'Szarma'}
                    pattern="\p{L}+([ \-']\p{L}+)*"
                    autoComplete={'family-name'}
                    onChange={(e) => setLastName(e.target.value)}
                />
            </Field>
            <Button
                type={"submit"}
                variant={"outline"}
                disabled={status === 'sending'}
            >
                {status === 'sending' ? "aktualizowanie..." : "kontynuuj"}
            </Button>
            {status === 'error' &&
                <FieldError>
                    nie udało się zaktualizować imienia, spróbuj ponownie.
                </FieldError>
            }
        </form>
    )
}