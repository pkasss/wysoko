import Link from "next/link";
import {buttonVariants} from "@/src/components/ui/button";
import {getCompetition} from "@/src/db/queries/competitions";
import {notFound} from "next/navigation";
import {getLeaderboard} from "@/src/db/queries/leaderboard";
import {
    DEFAULT_LEADERBOARD,
    LEADERBOARDS,
    LEADERBOARD_TYPES,
    isLeaderboardType
} from "@/src/lib/ranking";
import {Panel} from "@/src/components/Panel";

export default async function CompetitionRanking({
    params, searchParams
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ ranking?: string }>
}) {

    const {slug} = await params;
    const {ranking} = await searchParams;

    const competition = await getCompetition(slug);
    if(!competition) {
        notFound();
    }

    const leaderboardType = ranking && isLeaderboardType(ranking) ? ranking : DEFAULT_LEADERBOARD;
    const {category, gender} = LEADERBOARDS[leaderboardType];
    const leaderboard = await getLeaderboard(competition.id, category, gender);

    return (
        <Panel>
            <h2>{LEADERBOARDS[leaderboardType].label}</h2>
            <nav className={'flex gap-2'}>
                {LEADERBOARD_TYPES.map((key) => (
                    <Link
                        key={key}
                        href={`/zawody/${slug}/ranking?ranking=${key}`}
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
    )
}