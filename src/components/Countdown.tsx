'use client';

import {useEffect} from "react";
import {useNow} from "@/src/lib/hooks";
import {useRouter} from "next/navigation";
import {formatDuration} from "@/src/lib/dates";

const boxClass = 'flex items-center justify-between w-full rounded-xl p-2 my-4 bg-black text-white';
const labelClass = 'pl-2 text-xl';
const timeClass = 'pr-2 text-5xl font-display tabular-nums';

export function Countdown({
    steps, doneLabel, refreshOnDone
}: {
    steps: {until: Date, label: string}[],
    doneLabel: string,
    refreshOnDone?: boolean
}) {
    const router = useRouter();
    const currentTime = useNow();
    const step = currentTime && steps.find((s) => currentTime < s.until);
    const isDone = currentTime !== null && step === undefined;

    useEffect(() => {
        if (refreshOnDone && isDone) {
            router.refresh();
        }
    }, [refreshOnDone, isDone, router]);

    if (!currentTime) {
        return (
            <div className={boxClass} aria-hidden>
                <p className={`${labelClass} invisible`}>{steps[0]?.label ?? doneLabel}</p>
                <span className={`${timeClass} invisible`}>0:00:00</span>
            </div>
        );
    }

    let label: string;
    let time: string | null;

    if (step) {
        label = step.label;
        time = formatDuration(step.until.getTime() - currentTime.getTime());
    } else {
        label = doneLabel;
        time = null;
    }

    return (
        <div className={boxClass}>
            <p className={labelClass}>{label}</p>
            {time !== null && <span className={timeClass}>{time}</span>}
        </div>
    );
}