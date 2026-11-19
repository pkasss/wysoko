'use client';

import {CompetitorBoulder, statusStyle} from "@/src/lib/boulders-state";
import {cn} from "@/src/lib/utils";
import {Fragment, useState, useTransition} from "react";
import {getCompetitorBoulders} from "@/src/db/actions/competitors";

export function LeaderboardRow({
    row, className
}: {
    row: {competitorId: number, place: number, name: string, pointsSum: number, flashCount: number, isFinalist: boolean};
    className: string;
}) {
    const [open, setOpen] = useState<boolean>(false);
    const [boulders, setBoulders] = useState<CompetitorBoulder[] | null>(null);
    const [isPending, startTransition] = useTransition();

    function toggle() {
        if (open) {
            setOpen(false);
            return;
        }

        startTransition(async () => {
            const found = await getCompetitorBoulders(row.competitorId);
            setBoulders(found.ok ? found.boulders : []);
            setOpen(true);
        });
    }

    const panelId = `competitor-${row.competitorId}-boulders`;

    return (
        <Fragment>
            <tr className={className}>
                <td className={'pl-2 font-display text-2xl'}>{row.place}</td>
                <td className={'font-semibold'}>
                    <button
                        type={'button'}
                        onClick={toggle}
                        aria-expanded={open}
                        aria-controls={panelId}
                        className={'text-left'}
                    >
                        {row.name}
                        {row.isFinalist && <span className={'px-3'}>🏁</span>}
                    </button>
                </td>
                <td className={'tabular-nums text-right'}>{row.pointsSum}</td>
                <td className={'pr-2 tabular-nums text-right'}>{row.flashCount}</td>
            </tr>
            <tr id={panelId}>
                <td colSpan={4} className={'p-0'}>
                    <div
                        className={cn(
                            'grid transition-[grid-template-rows] duration-1000 ease-out',
                            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}
                        inert={!open}
                    >
                        <div className={'overflow-hidden'}>
                            <div className={'py-3'}>
                                {isPending || boulders === null ? (
                                    <p className={'text-center text-sm text-black/60'}>Ładowanie…</p>
                                ) : boulders.length === 0 ? (
                                    <p className={'text-center text-sm text-black/60'}>Wyniki są teraz niedostępne.</p>
                                ) : (
                                    <div className={'grid grid-cols-5 gap-2'}>
                                        {boulders.map((boulder, index) => (
                                            <div
                                                key={boulder.id}
                                                style={{animationDelay: `${index * 10}ms`}}
                                                className={cn(
                                                    'flex h-12 flex-col items-center justify-center rounded-lg border-2 border-black',
                                                    'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 duration-1000 fill-mode-both',
                                                    statusStyle[boulder.status].className
                                                )}
                                            >
                                                <span className={'text-base font-bold leading-none'}>{boulder.number}</span>
                                                <span className={'text-[10px]'}>{boulder.grade}AV</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </Fragment>
    );
}