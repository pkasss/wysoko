'use client';

import {useOptimistic, useState, useTransition} from "react";
import {
    type Boulder,
    type Boulders,
    type BoulderStatus,
    type SaveResultCode,
    getBoulderStatus,
    getNextStatus,
    saveResultResponseMessage, statusFlags
} from "@/src/lib/boulders-state";
import {saveResult} from "@/src/db/actions/results";

const statusColor: Record<BoulderStatus, string> = {
    none: 'bg-gray-200',
    zone: 'bg-green-500',
    top: 'bg-red-500',
    flash: 'bg-yellow-500',
};

export function BouldersGrid({
    boulders, competitorId
}: {
    boulders: Boulders;
    competitorId: number;
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
        startTransition(async () => {
            const nextStatus = getNextStatus(getBoulderStatus(boulder));

            setOptimisticBoulder({boulderId: boulder.id, status: nextStatus});

            const response = await saveResult({competitorId, boulderId: boulder.id, boulderStatus: nextStatus});
            setErrorCode(response.ok ? null : response.reason);
        });
    }

    console.log('render', optimisticBoulders.filter((b) => b.isZone).length);
    return (
        <section>
            {errorCode && <p>{saveResultResponseMessage[errorCode]}</p>}
            <div className={"grid grid-cols-5 gap-2"}>
                {optimisticBoulders.map((boulder) => (
                    <button
                        key={boulder.id}
                        type="button"
                        onClick={() => handleClick(boulder)}
                        className={`rounded border p-2 ${statusColor[getBoulderStatus(boulder)]}`}
                    >
                        <span className={'block text-lg font-bold'}>{boulder.number}</span>
                        <span className={'block text-sm'}>{boulder.grade}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}