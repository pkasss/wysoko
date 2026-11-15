import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {CLOSING_TIME} from "@/src/lib/boulders-state";
import {buttonVariants} from "@/src/components/ui/button";
import {getCompetition} from "@/src/db/queries/competitions";

import {cn} from "@/src/lib/utils"
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {getFirstName} from "@/src/lib/names";
import {Panel} from "@/src/components/Panel";
import {formatTime, getToday} from "@/src/lib/dates";
import {BouldersGrid} from "@/src/components/BouldersGrid";
import {getCompetitors} from "@/src/db/queries/competitors";
import {getBouldersWithResults} from "@/src/db/queries/boulders";
import {Countdown} from "@/src/components/Countdown";

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

        const boulders = await getBouldersWithResults(competition.id, competitor.id);
        const heatNumber = competitor.heatNumber ?? 'Dożynkowa';
        const openingTime = competitor.startTime;
        const endingTime = competitor.endTime;
        const closingTime = new Date(endingTime.getTime() + CLOSING_TIME);

        joinSection = (
            <>
                <Panel>
                    <p className={'text-lg'}>Cześć,</p>
                    <h2 className={'text-7xl font-display pb-4'}>{getFirstName(competitor.name)}!</h2>
                    <div className={'flex flex-col tabular-nums'}>
                        <p>
                            <span className={'font-bold'}>
                                Grupa {heatNumber}
                            </span>
                            {' · '}
                            <span>{formatTime(openingTime)}–{formatTime(endingTime)}</span>
                        </p>
                        <p>Wyniki możesz wpisywać do {formatTime(closingTime)}</p>
                    </div>
                    <Countdown startTime={competitor.startTime} endTime={competitor.endTime}/>
                    {competitors.length > 1 && (
                        <nav className={'flex gap-2'}>
                            {competitors.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/zawody/${slug}?zawodnik=${c.id}`}
                                    className={cn(buttonVariants({
                                        variant: c.id === competitor.id ? 'default' : 'outline',
                                    }), 'border-2 border-black shadow-[3px_3px_0_#000] rounded-full ' +
                                        'active:translate-x-0.75 active:translate-y-0.75 active:shadow-none ' +
                                        'transition-transform')}
                                >
                                    {getFirstName(c.name)}
                                </Link>
                            ))}
                        </nav>
                    )}
                </Panel>
                <Panel>
                    <BouldersGrid
                        key={competitor.id}
                        boulders={boulders}
                        competitorId={competitor.id}
                        heatStartTime={competitor.startTime}
                        heatEndTime={competitor.endTime}
                    />
                </Panel>
            </>
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
        <>
            {joinSection}
        </>
    );
}