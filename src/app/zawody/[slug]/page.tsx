import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {getCompetition} from "@/src/db/queries/competitions";
import {
    DEFAULT_LEADERBOARD,
    LEADERBOARDS,
    LEADERBOARD_TYPES,
    levelStyle,
    isLeaderboardType, getLevel,
    LeaderboardType
} from "@/src/lib/ranking";
import {Fragment} from "react";
import {cn} from "@/src/lib/utils";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {Panel, pressableClass} from "@/src/components/Panel";
import {getLeaderboard} from "@/src/db/queries/leaderboard";
import {RankingSummary} from "@/src/components/RankingSummary";
import {getCompetitors} from "@/src/db/queries/competitors";
import {Category, Gender} from "@/src/db/schema";
import {getAllHeats} from "@/src/db/queries/heats";
import {RESULT_REVEAL_DELAY} from "@/src/lib/boulders-state";
import {Countdown} from "@/src/components/Countdown";

function pickLeaderboard({ranking, zawodnik, competitors}: {
    ranking: string | undefined;
    zawodnik: string | undefined;
    competitors: { id: number, category: Category, gender: Gender }[];
}): LeaderboardType {
    if (ranking && isLeaderboardType(ranking)) {
        return ranking;
    }

    const competitor = competitors.find(c => c.id === Number(zawodnik)) ?? competitors.at(0);

    if (competitor) {
        const key = `${competitor.category}-${competitor.gender}`;

        return isLeaderboardType(key) ? key : DEFAULT_LEADERBOARD;
    }

    return DEFAULT_LEADERBOARD;
}

function getHref(slug: string, ranking: LeaderboardType, zawodnik: string | undefined) {
    const query = new URLSearchParams({ranking});
    if (zawodnik) {
        query.set('zawodnik', zawodnik);
    }

    return `/zawody/${slug}?${query}`;
}

export default async function CompetitionRanking({
    params, searchParams
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ ranking?: string, zawodnik?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const {slug} = await params;
    const {ranking, zawodnik} = await searchParams;

    const competition = await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const allHeats = await getAllHeats(competition.id);
    const harvestFestHeat = allHeats.find((heat) => heat.type === 'harvestFest');

    const now = new Date();

    const resultsHidden = harvestFestHeat !== undefined
        && now.getTime() >= harvestFestHeat.startTime.getTime()
        && now.getTime() < harvestFestHeat.endTime.getTime() + RESULT_REVEAL_DELAY;

    if (resultsHidden) {
        const revealTime = new Date(harvestFestHeat.endTime.getTime() + RESULT_REVEAL_DELAY);

        return (
            <Panel className={'flex flex-col text-center'}>
                <h2 className={'text-xl'}>
                    Trwa grupa <span className={'font-display text-4xl'}>dożynkowa</span>.
                    Wyniki zostały ukryte.
                </h2>
                <Countdown
                    steps={[{until: revealTime, label: 'Wyniki wrócą za:'}]}
                    doneLabel={'Odśwież stronę, żeby zobaczyć wyniki.'}
                    refreshOnDone
                />
            </Panel>
        );
    }

    const competitors = session ? await getCompetitors(session.user.id, competition.id) : [];

    const leaderboardType = pickLeaderboard({ranking, zawodnik, competitors});
    const {category, gender} = LEADERBOARDS[leaderboardType];
    const leaderboard = await getLeaderboard(competition.id, category, gender);

    const myCompetitorsIds = new Set(competitors.map((c) => c.id));
    const myRows = leaderboard.filter((row) => myCompetitorsIds.has(row.competitorId));

    const placeCounts = new Map<number, number>();
    for (const result of leaderboard) {
        placeCounts.set(result.place, (placeCounts.get(result.place) ?? 0) + 1);
    }
    const rows = leaderboard.map((row) => {
        const tied = placeCounts.get(row.place) ?? 0;
        const beaten = leaderboard.length - (row.place - 1) - tied;
        const level = category === 'adult' ? getLevel(beaten, leaderboard.length) : null;

        return {...row, level};
    });

    return (
        <>
            {!session && (
                <Link
                    href={`/login?next=/zawody/${competition.slug}/wyniki`}
                    className={cn(pressableClass, 'text-center text-4xl block')}
                >
                    Startujesz? Zaloguj się!
                </Link>
            )}
            {myRows.map((row) => (
                <RankingSummary
                    key={row.competitorId}
                    row={row}
                    total={leaderboard.length}
                    above={leaderboard.findLast((other) => other.place < row.place)}
                />
            ))}
            <Panel className={'flex flex-col items-center gap-4'}>
                <h2 className={'font-display text-6xl'}>{LEADERBOARDS[leaderboardType].label}</h2>
                <nav className={'flex flex-wrap gap-3'}>
                    {LEADERBOARD_TYPES.map((key) => (
                        <Link
                            key={key}
                            href={getHref(slug, key, zawodnik)}
                            scroll={false}
                            className={cn(pressableClass,
                                key === leaderboardType ? 'bg-black text-white' : 'bg-white',
                                'py-2 text-base rounded-full')}
                        >
                            {LEADERBOARDS[key].label}
                        </Link>
                    ))}
                </nav>
                {leaderboard.length === 0 ? (
                    <p>brak wyników.</p>
                ) : (
                    <table className={'w-full text-sm'}>
                        <thead className={`sticky top-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)] 
                                           z-10 text-xs text-left uppercase tracking-wide`}>
                        <tr className={`*:bg-white *:py-2 *:first:rounded-l-full *:first:pl-4 
                                        *:last:rounded-r-full *:last:pr-4 
                                        *:shadow-[inset_0_2px_0_#000,inset_0_-2px_0_#000,4px_4px_0_#000]`}>
                            <th scope={'col'} className={'w-10'}>#</th>
                            <th scope={'col'}>Zawodnik</th>
                            <th scope={'col'} className={'text-right'}>Pkt</th>
                            <th scope={'col'} className={'text-right'}>Fl.</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, index) => {
                            const isNewLevel = row.level && row.level !== rows[index - 1]?.level;

                            return (
                                <Fragment key={row.competitorId}>
                                    {isNewLevel && row.level && (
                                        <tr>
                                            <th
                                                colSpan={4}
                                                scope={'rowgroup'}
                                                className={cn('pb-2', index === 0 ? 'pt-2' : 'pt-6')}
                                            >
                                                <span
                                                    className={cn(
                                                        `inline-block rounded-lg border-2 
                                                        border-black px-3 pt-1 font-display 
                                                        text-3xl leading-none shadow-[2px_2px_0_#000]`,
                                                        levelStyle[row.level]
                                                    )}
                                                >
                                                    {row.level}
                                                </span>
                                            </th>
                                        </tr>
                                    )}
                                    <tr
                                        className={cn(
                                            '*:py-2.5 border-t border-black/10',
                                            row.level && levelStyle[row.level],
                                            myCompetitorsIds.has(row.competitorId) &&
                                            'bg-black text-white border-2 border-black')}
                                    >
                                        <td className={'pl-2 font-display text-2xl'}>{row.place}</td>
                                        <td className={'font-semibold'}>{row.name}</td>
                                        <td className={'tabular-nums text-center'}>{row.pointsSum}</td>
                                        <td className={'pr-2 tabular-nums text-center'}>{row.flashCount}</td>
                                    </tr>
                                </Fragment>
                            )
                        })}
                        </tbody>
                    </table>
                )}
            </Panel>
        </>
    )
}