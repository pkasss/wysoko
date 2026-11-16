import {Panel} from "@/src/components/Panel";
import {StatTile} from "@/src/components/StatTile";
import {getFirstName} from "@/src/lib/names";
import type {getLeaderboard} from "@/src/db/queries/leaderboard";
import {statusStyle} from "@/src/lib/boulders-state";

type LeaderboardRow = Awaited<ReturnType<typeof getLeaderboard>>[number];

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