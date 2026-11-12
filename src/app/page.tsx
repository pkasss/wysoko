import {auth} from "@/src/lib/auth";

import {headers} from "next/headers";
import {getToday} from "@/src/lib/dates";
import {redirect} from "next/navigation";
import {getCompetitions} from "@/src/db/queries/competitions";

export default async function Home() {
    redirect('/zawody/krak-em-all-2026');

    const session = await auth.api.getSession({
        headers: await headers()
    });


    const competitions = await getCompetitions();
    const today = getToday();

    const ongoing = competitions.find(
        competition => competition.startDate <= today && competition.endDate >= today
    );

    const finished = competitions.filter(
        competition => competition.endDate < today
    )

    return (
        <main className={''}>
            <pre>{JSON.stringify(ongoing, null, 2)}</pre>
            <pre>{JSON.stringify(finished, null, 2)}</pre>
        </main>
    );
}
