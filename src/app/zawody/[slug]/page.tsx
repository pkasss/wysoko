import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {buttonVariants} from "@/src/components/ui/button";

import {headers} from "next/headers";
import {getToday} from "@/src/lib/dates";
import {notFound} from "next/navigation";
import {BouldersGrid} from "@/src/components/BouldersGrid";
import {getCompetitors} from "@/src/db/queries/competitors";
import {getCompetition} from "@/src/db/queries/competitions";
import {getBouldersWithResults} from "@/src/db/queries/boulders";

export default async function Competition({
                                              params, searchParams
                                          }: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ zawodnik?: string }>
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
    const {zawodnik} = await searchParams;
    const competitor = competitors.find(c => c.id === Number(zawodnik)) ?? competitors[0];

    const isFinished = competition.endDate < getToday();

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
                                href={`/zawody/${competition.slug}?zawodnik=${c.id}`}
                                className={buttonVariants({
                                    variant: c.id === competitor.id ? 'default' : 'outline',
                                })}
                            >
                                {c.name.split(' ')[0]}
                            </Link>
                        ))}
                    </nav>
                )}
                <BouldersGrid key={competitor.id} boulders={boulders} competitorId={competitor.id} />
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
        </main>
    );
}