'use client';

import {authClient} from "@/src/lib/auth-client";
import {SubmitEvent, useState} from "react";

import {
    Field,
    FieldDescription,
    FieldLabel,
    FieldError
} from "@/src/components/ui/field";
import {cn} from "@/src/lib/utils";
import {Panel, panelClass} from "@/src/components/Panel";
import {Input} from "@/src/components/ui/input";
import {Button} from "@/src/components/ui/button";

type LoginStatus = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

export function LoginForm({
    callbackURL, linkExpired
} : {
    callbackURL: string;
    linkExpired: boolean;
}) {
    const [mail, setMail] = useState("");
    const [status, setStatus] = useState<LoginStatus>('idle');

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        setStatus('sending');

        const errorParams = new URLSearchParams({ next: callbackURL });

        const {error} = await authClient.signIn.magicLink({
            email: mail.trim(),
            callbackURL,
            errorCallbackURL: `/login?${errorParams}`
        });

        if (error) {
            setStatus(error.status === 429 ? 'rate_limited' : 'error');
        } else {
            setStatus('sent');
        }
    }

    if (status === 'sent') {
        return (
            <Panel className={'flex flex-col gap-4'}>
                <h1 className={'font-display text-6xl leading-none'}>Sprawdź skrzynkę</h1>
                <p>
                    Wysłaliśmy link do logowania na{' '}
                    <span className={'font-semibold break-all block font-display text-3xl'}>{mail}.</span>
                </p>
                <ul className={'flex list-disc flex-col gap-1 pl-5 text-sm'}>
                    <li>Link jest ważny przez 15 minut.</li>
                    <li className={'font-semibold'}>Otwórz go na telefonie, na którym chcesz wpisywać wyniki.</li>
                    <li>Nie widzisz maila? Sprawdź folder ze spamem.</li>
                </ul>
                <button
                    type={'button'}
                    onClick={() => setStatus('idle')}
                    className={cn(
                        panelClass,
                        `w-full py-3 font-display text-2xl active:translate-x-1.5 
                        active:translate-y-1.5 active:shadow-none transition-transform`
                    )}
                >
                    Wpisz inny mail
                </button>
            </Panel>

        )
    }

    return (
        <Panel>
            <h1 className={'font-display text-6xl pb-4'}>Zaloguj się</h1>
            {linkExpired && (
                <p
                    className={'rounded-xl border-2 border-black bg-[#ffd6e7] px-3 py-2 text-sm'}
                >
                    Ten link został już użyty albo wygasł. Wpisz maila, wyślemy nowy.
                </p>
            )}
            <form className={'flex flex-col gap-2 w-full max-w-sm'} onSubmit={handleSubmit}>
                <FieldLabel htmlFor={"email"} className={'text-lg'}>
                    Podaj maila.
                </FieldLabel>
                <Field>
                    <Input
                        id={"email"}
                        type={"email"}
                        name={'email'}
                        autoComplete={'email'}
                        inputMode={'email'}
                        autoCapitalize={'none'}
                        autoCorrect={'off'}
                        spellCheck={false}
                        required
                        placeholder={"example@mail.com"}
                        value={mail}
                        onChange={(e) => setMail(e.target.value)}
                    />
                    <FieldDescription className={'text-xs'}>
                        Użyj maila podanego przy zapisach na zawody.
                    </FieldDescription>
                </Field>
                <Button
                    type={"submit"}
                    variant={"outline"}
                    disabled={status === 'sending'}
                    className={cn(`m-3 h-auto font-display text-2xl active:bg-[#ff3d8f] 
                                   active:translate-x-0.75 active:translate-y-0.75 
                                   active:shadow-none`, panelClass)}
                >
                    {status === 'sending' ? "wysyłanie..." : "kontynuuj"}
                </Button>
                {status === 'error' &&
                    <FieldError>
                        Nie udało się wysłać linku, spróbuj ponownie.
                    </FieldError>
                }
                {status === 'rate_limited' &&
                    <FieldError>
                        Za dużo prób. Spróbuj ponownie za minutę.
                    </FieldError>
                }
            </form>
        </Panel>
    );
}