import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {buttonVariants} from "@/src/components/ui/button";
import {getCompetition} from "@/src/db/queries/competitions";
import {
    DEFAULT_LEADERBOARD,
    LEADERBOARDS,
    LEADERBOARD_TYPES,
    isLeaderboardType, LeaderboardType
} from "@/src/lib/ranking";
import {cn} from "@/src/lib/utils";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {Panel, pressableClass} from "@/src/components/Panel";
import {getLeaderboard} from "@/src/db/queries/leaderboard";
import {RankingSummary} from "@/src/components/RankingSummary";
import {getCompetitors} from "@/src/db/queries/competitors";
import {Category, Gender} from "@/src/db/schema";

function pickLeaderboard({ranking, competitors}: {
    ranking: string | undefined;
    competitors: { category: Category, gender: Gender }[];
}): LeaderboardType {
    const competitor = competitors.at(0);

    if (ranking && isLeaderboardType(ranking)) {
        return ranking;
    }
    if (competitor) {
        const key = `${competitor.category}-${competitor.gender}`;

        return isLeaderboardType(key) ? key : DEFAULT_LEADERBOARD;
    }

    return DEFAULT_LEADERBOARD;
}

export default async function CompetitionRanking({
                                                     params, searchParams
                                                 }: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ ranking?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const {slug} = await params;
    const {ranking} = await searchParams;

    const competition = await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const competitors = session ? await getCompetitors(session.user.id, competition.id) : [];

    const leaderboardType = pickLeaderboard({ranking, competitors});
    const {category, gender} = LEADERBOARDS[leaderboardType];
    const leaderboard = await getLeaderboard(competition.id, category, gender);

    const myCompetitorsIds = new Set(competitors.map((c) => c.id));
    const myRows = leaderboard.filter((row) => myCompetitorsIds.has(row.competitorId));

    return (
        <>
            {!session && (
                <Link
                    href={`/login?next=/zawody/${competition.slug}/wyniki`}>
                    <Panel className={cn(pressableClass, 'text-center text-4xl')}>
                        Startujesz? Zaloguj się!
                    </Panel>
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
            <Panel>
                <h2>{LEADERBOARDS[leaderboardType].label}</h2>
                <nav className={'flex gap-2'}>
                    {LEADERBOARD_TYPES.map((key) => (
                        <Link
                            key={key}
                            href={`/zawody/${slug}/?ranking=${key}`}
                            scroll={false}
                            className={buttonVariants({
                                variant: key === leaderboardType ? 'default' : 'outline',
                            })}
                        >
                            {LEADERBOARDS[key].label}
                        </Link>
                    ))}
                </nav>
                {leaderboard.length === 0 ? (
                    <p>brak wyników.</p>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>imię i nazwisko</th>
                            <th>suma punktów</th>
                            <th>liczba fleszy</th>
                        </tr>
                        </thead>
                        <tbody>
                        {leaderboard.map((result) => (
                            <tr key={result.competitorId}>
                                <td>{result.place}</td>
                                <td>{result.name}</td>
                                <td>{result.pointsSum}</td>
                                <td>{result.flashCount}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </Panel>
        </>
    )
}