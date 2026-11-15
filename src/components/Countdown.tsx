'use client';

import {useEffect, useState} from "react";
import {CLOSING_TIME} from "@/src/lib/boulders-state";

function formatDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function Countdown({startTime, endTime}: { startTime: Date, endTime: Date }) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        const updateTime = () => setCurrentTime(new Date());
        updateTime();

        const id = setInterval(updateTime, 1000);

        return () => clearInterval(id);
    }, []);

    if (!currentTime) {
        return (
            <div className={'flex items-center justify-between w-full rounded-xl p-2 my-2 bg-black text-white'}>
            </div>
        );
    }

    let label: string;
    let time: number | null;

    if (currentTime < startTime) {
        label = 'Do startu grupy pozostało:';
        time = startTime.getTime() - currentTime.getTime();
    } else if (currentTime < endTime) {
        label = 'Do końca grupy pozostało:';
        time = endTime.getTime() - currentTime.getTime();
    } else if (currentTime.getTime() < endTime.getTime() + CLOSING_TIME) {
        label = 'Do końca wpisywania wyników pozostało:';
        time = endTime.getTime() + CLOSING_TIME - currentTime.getTime();
    } else {
        label = 'Grupa zakończona.';
        time = null;
    }

    return (
        <div className={'flex items-center justify-between w-full rounded-xl p-2 my-4 bg-black text-white'}>
            <p className={'pl-2 text-xl'}>{label}</p>
            {time != null &&
                <span className={'pr-2 text-5xl font-display tabular-nums'}>{formatDuration(time)}</span>}
        </div>
    )
}