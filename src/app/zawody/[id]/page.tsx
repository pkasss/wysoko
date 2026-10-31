import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {Button, buttonVariants} from "@/src/components/ui/button";

import {headers} from "next/headers";
import {getToday} from "@/src/lib/dates";
import {notFound} from "next/navigation";
import {BouldersGrid} from "@/src/components/BouldersGrid";
import {getCompetitor} from "@/src/db/queries/competitors";
import {getCompetition} from "@/src/db/queries/competitions";
import {getBouldersWithResults} from "@/src/db/queries/boulders";

export default async function Competition({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {id} = await params;
    const competitionId = Number(id);

    if (!Number.isInteger(competitionId)) {
        notFound();
    }

    const competition = await getCompetition(competitionId);

    if (!competition) {
        notFound();
    }

    const competitor = session ? await getCompetitor(session.user.id, competitionId) : undefined;
    const isFinished = competition.endDate < getToday();

    let joinSection: React.ReactNode;

    if (competitor) {

        const boulders = await getBouldersWithResults(competitionId, competitor.id)

        joinSection = (
            <section>
                <p>jesteś zawodnikiem już.</p>
                <BouldersGrid boulders={boulders} />
            </section>
        )
    } else if (isFinished) {
      joinSection = (
          <p>zapisy zakończone.</p>
      )
    } else if (!session) {
        joinSection = (
            <Link
                href={`/login?next=/zawody/${competitionId}`}
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