'use client';

import {useOptimistic, useState, useTransition} from "react";
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
import {saveResult} from "@/src/db/actions/results";

const statusColor: Record<BoulderStatus, string> = {
    none: 'bg-white border-black/15',
    zone: 'bg-green-500 border-green-600 text-white',
    top: 'bg-red-500 border-red-600 text-white',
    flash: 'bg-yellow-400 border-yellow-500',
};

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

    return (
        <section>
            {errorCode && <p>{saveResultResponseMessage[errorCode]}</p>}
            <div className={"grid grid-cols-5 gap-2"}>
                {optimisticBoulders.map((boulder) => (
                    <button
                        key={boulder.id}
                        type="button"
                        onClick={() => handleClick(boulder)}
                        className={`rounded-xl border-2 py-2.5 transition-transform active:scale-95 ${statusColor[getBoulderStatus(boulder)]}`}
                    >
                        <span className={'block text-lg font-bold'}>{boulder.number}</span>
                        <span className={'block text-sm'}>{boulder.grade}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}