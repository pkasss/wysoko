'use client';

import {Boulder, type Boulders, type BoulderStatus, getBoulderStatus, getNextStatus} from "@/src/lib/boulders-state";
import {saveResult} from "@/src/db/actions/results";

const statusColor: Record<BoulderStatus, string> = {
    none: 'bg-gray-200',
    zone: 'bg-green-500',
    top: 'bg-red-500',
    flash: 'bg-yellow-500',
};

async function handleClick(boulder: Boulder) {
    const nextStatus = getNextStatus(getBoulderStatus(boulder));

    await saveResult(boulder.id, nextStatus);
}

export function BouldersGrid({
    boulders
}: {
    boulders: Boulders;
}) {
    return (
        <div className={"grid grid-cols-5 gap-2"}>
            {boulders.map((boulder) => (
                <button
                    key={boulder.id}
                    type="button"
                    onClick={() => handleClick(boulder)}
                    className={`rounded border p-2 ${statusColor[getBoulderStatus(boulder)]}`}
                >
                    <span className={'block'}>
                        <p className={"text-lg font-bold"}>{boulder.number}</p>
                        <p className={"text-sm"}>{boulder.grade}</p>
                    </span>
                </button>
            ))}
        </div>
    )
}