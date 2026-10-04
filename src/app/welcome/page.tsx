'use client';

import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Field} from "@/components/ui/field";

export default function Welcome() {
    const [name, setName] = useState('');

    return (
        <main className="flex min-h-dvh items-center justify-center p-4">
            <Field className={"w-full max-w-sm"}>
                <h1 className={"text-2xl"}>Cześć, {name}!</h1>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </Field>
        </main>
    )
}