'use client';

import {useState} from "react";
import {
    type Boulder,
    type Boulders,
    type BoulderStatus,
    type SaveResultCode,
    getBoulderStatus,
    getNextStatus,
    saveResultResponseMessage
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

    async function handleClick(boulder: Boulder) {
        const nextStatus = getNextStatus(getBoulderStatus(boulder));

        const response = await saveResult({competitorId, boulderId: boulder.id, boulderStatus: nextStatus});
        setErrorCode(response.ok ? null : response.reason);
    }

    return (
        <section>
            {errorCode && <p>{saveResultResponseMessage[errorCode]}</p>}
            <div className={"grid grid-cols-5 gap-2"}>
                {boulders.map((boulder) => (
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