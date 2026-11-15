import {cn} from "@/src/lib/utils";
import {Panel} from "@/src/components/Panel";
import {getFirstName} from "@/src/lib/names";
import type {getLeaderboard} from "@/src/db/queries/leaderboard";
import {statusStyle} from "@/src/lib/boulders-state";

type LeaderboardRow = Awaited<ReturnType<typeof getLeaderboard>>[number];

function StatTile({label, value, className}: {label:string, value: string | number, className?: string}) {
    return (
        <div className={cn('rounded-lg px-3 py-2 border-2 border-black', className)}>
            <p className={'font-semibold text-sm'}>{label}</p>
            <p className={'font-display text-4xl'}>{value}</p>
        </div>
    )
}

export function RankingSummary({
    row, total, above
}: {
    row: LeaderboardRow,
    total: number,
    above: LeaderboardRow | undefined
}) {

    let gapLabel: string | null;
    if (!above) {
        gapLabel = null;
    } else if (above.pointsSum - row.pointsSum > 0) {
        gapLabel = `${above.pointsSum - row.pointsSum} pkt`;
    } else {
        gapLabel = `${above.flashCount - row.flashCount} fl.`;
    }

    return (
        <Panel>
            <p>{getFirstName(row.name)}, jesteś na</p>
            <p className={'flex items-baseline gap-2'}>
                <span className={'font-display text-7xl leading-none'}>{row.place}. miejscu</span>
                <span>z {total}</span>
            </p>
            <div className={'grid grid-cols-3 gap-2'}>
                <StatTile
                    label={'Punkty'}
                    value={row.pointsSum}
                    className={statusStyle.none.className}
                />
                <StatTile
                    label={'Flesze'}
                    value={row.flashCount}
                    className={statusStyle.flash.className}
                />
                {above && gapLabel && (
                    <StatTile
                        label={`Do ${above.place}. miejsca`}
                        value={gapLabel}
                        className={statusStyle.top.className}
                    />
                )}
            </div>
        </Panel>
    )
}