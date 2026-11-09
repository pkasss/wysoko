import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {buttonVariants} from "@/src/components/ui/button";

import {headers} from "next/headers";
import {getToday} from "@/src/lib/dates";
import {notFound} from "next/navigation";
import {getLeaderboard} from "@/src/db/queries/leaderboard";
import {BouldersGrid} from "@/src/components/BouldersGrid";
import {getCompetitors} from "@/src/db/queries/competitors";
import {getCompetition} from "@/src/db/queries/competitions";
import {getBouldersWithResults} from "@/src/db/queries/boulders";
import {
    isLeaderboardType,
    DEFAULT_LEADERBOARD,
    LEADERBOARDS,
    type LeaderboardType,
    LEADERBOARD_TYPES
} from "@/src/lib/ranking";

type CompetitionHrefOptions = {competitorId?: number, leaderboard?: LeaderboardType};
function competitionHref(slug: string, {competitorId, leaderboard}: CompetitionHrefOptions) {
    const params = new URLSearchParams();

    if (competitorId !== undefined) {
        params.append('zawodnik', String(competitorId));
    }
    if (leaderboard) {
        params.append('ranking', leaderboard);
    }

    const query = params.size > 0 ? `?${params}` : ''

    return `/zawody/${slug}${query}`;
}

export default async function Competition({
    params, searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ zawodnik?: string, ranking?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {slug} = await params;

    const competition = await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const competitors = session ? await getCompetitors(session.user.id, competition.id) : [];
    const {zawodnik, ranking} = await searchParams;
    const competitor = competitors.find(c => c.id === Number(zawodnik)) ?? competitors[0];

    const isFinished = competition.endDate < getToday();

    const leaderboardType = ranking && isLeaderboardType(ranking) ? ranking : DEFAULT_LEADERBOARD;
    const {category, gender} = LEADERBOARDS[leaderboardType];
    const leaderboard = await getLeaderboard(competition.id, category, gender);

    let joinSection: React.ReactNode;

    if (competitor) {

        const boulders = await getBouldersWithResults(competition.id, competitor.id)

        joinSection = (
            <section>
                <p>jesteś zawodnikiem już.</p>
                {competitors.length > 1 && (
                    <nav className={'flex gap-2'}>
                        {competitors.map((c) => (
                            <Link
                                key={c.id}
                                href={competitionHref(slug, {competitorId: c.id, leaderboard: leaderboardType})}
                                className={buttonVariants({
                                    variant: c.id === competitor.id ? 'default' : 'outline',
                                })}
                            >
                                {c.name.split(' ')[0]}
                            </Link>
                        ))}
                    </nav>
                )}
                <BouldersGrid
                    key={competitor.id}
                    boulders={boulders}
                    competitorId={competitor.id}
                    heatStartTime={competitor.startTime}
                    heatEndTime={competitor.endTime}
                />
            </section>
        )
    } else if (isFinished) {
        joinSection = (
            <p>zapisy zakończone.</p>
        )
    } else if (!session) {
        joinSection = (
            <Link
                href={`/login?next=/zawody/${competition.slug}`}
                className={buttonVariants({variant: "outline"})}>
                zaloguj się, żeby wystartować.
            </Link>
        );
    } else {
        joinSection = (
            <p>nie ma cie na liście uczestników.</p>
        )
    }

    return (
        <main>
            <div>Comp: {competition.name}</div>
            {joinSection}
            <section>
                <h2>{LEADERBOARDS[leaderboardType].label}</h2>
                <nav className={'flex gap-2'}>
                    {LEADERBOARD_TYPES.map((key) => (
                        <Link
                            key={key}
                            href={competitionHref(slug, {competitorId: competitor?.id, leaderboard: key})}
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
            </section>
        </main>
    );
}