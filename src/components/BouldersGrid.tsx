'use client';

import {
    type Boulder,
    type Boulders,
    type BoulderStatus,
    type SaveResultCode,
    getNextStatus,
    getBoulderStatus,
    statusFlags,
    CLOSING_TIME,
    saveResultResponseMessage
} from "@/src/lib/boulders-state";
import {cn} from "@/src/lib/utils";
import {saveResult} from "@/src/db/actions/results";
import {statusStyle} from "@/src/lib/boulders-state";
import {useOptimistic, useState, useTransition} from "react";
import {StatusLegend} from "@/src/components/StatusLegend";

export function BouldersGrid({
    boulders, competitorId, heatStartTime, heatEndTime
}: {
    boulders: Boulders;
    competitorId: number;
    heatStartTime: Date;
    heatEndTime: Date;
}) {
    const [errorCode, setErrorCode] = useState<SaveResultCode | null>(null)
    const [optimisticBoulders, setOptimisticBoulder] = useOptimistic(
        boulders,
        (current, changed: {boulderId: number; status: BoulderStatus}) => {
            return current.map((boulder) =>
                boulder.id === changed.boulderId ? {...boulder, ...statusFlags[changed.status]} : boulder,
            );
        },
    );
    const [, startTransition] = useTransition();

    function handleClick(boulder: Boulder) {
        const now = new Date().getTime();
        if (now < heatStartTime.getTime()) {
            setErrorCode('not_started');
            return;
        }
        if (now > heatEndTime.getTime() + CLOSING_TIME) {
            setErrorCode('closed');
            return;
        }
        startTransition(async () => {
            const nextStatus = getNextStatus(getBoulderStatus(boulder));

            setOptimisticBoulder({boulderId: boulder.id, status: nextStatus});

            const response = await saveResult({competitorId, boulderId: boulder.id, boulderStatus: nextStatus});
            setErrorCode(response.ok ? null : response.reason);
        });
    }

    const toppedBoulders = optimisticBoulders.filter((boulder: Boulder) => boulder.isTop)

    return (
        <section className={'flex flex-col gap-3'}>
            <div className={'flex items-start justify-between'}>
                <span className={'font-display text-6xl'}>
                    Twoje bouldery.
                </span>
                <span className={'text-xl'}>
                    {toppedBoulders.length}/{boulders.length}
                </span>
            </div>
            <StatusLegend/>
            {errorCode && <p>{saveResultResponseMessage[errorCode]}</p>}
            <div className={"grid grid-cols-5 gap-2 pr-1 pb-1 touch-manipulation"}>
                {optimisticBoulders.map((boulder) => (
                    <button
                        key={boulder.id}
                        type="button"
                        onClick={() => handleClick(boulder)}
                        className={cn(`border-2 border-black shadow-[3px_3px_0_#000] rounded-xl h-16 
                                       active:translate-x-0.75 active:translate-y-0.75 active:shadow-none 
                                       transition-transform`, statusStyle[getBoulderStatus(boulder)].className)
                        }
                    >
                        <span className={'block text-2xl font-bold'}>{boulder.number}</span>
                        <span className={'block text-xs'}>{boulder.grade}AV</span>
                    </button>
                ))}
            </div>
        </section>
    )
}