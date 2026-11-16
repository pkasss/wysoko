import {ReactNode} from "react";

import {BoulderStatus, CLOSING_TIME, getBoulderStatus} from "@/src/lib/boulders-state";
import {getCompetition} from "@/src/db/queries/competitions";
import {getAllHeats, getHarvestFestChanges} from "@/src/db/queries/heats";
import {auth} from "@/src/lib/auth";
import Link from "next/link";

import {cn} from "@/src/lib/utils"
import {headers} from "next/headers";
import {formatTime} from "@/src/lib/dates";
import {getFirstName} from "@/src/lib/names";
import {notFound, redirect} from "next/navigation";
import {Countdown} from "@/src/components/Countdown";
import {BouldersGrid} from "@/src/components/BouldersGrid";
import {getCompetitors} from "@/src/db/queries/competitors";
import {Panel, pressableClass} from "@/src/components/Panel";
import {SignOutButton} from "@/src/components/SignOutButton";
import {getBouldersWithResults} from "@/src/db/queries/boulders";


export default async function CompetitionResults({
    params, searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ zawodnik?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {slug} = await params;

    if (!session) {
        redirect(`/login?next=/zawody/${slug}/wyniki`)
    }

    const competition = await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const competitors = await getCompetitors(session.user.id, competition.id);
    const {zawodnik} = await searchParams;
    const competitor = competitors.find(c => c.id === Number(zawodnik)) ?? competitors[0];

    const now = new Date().getTime();
    const allHeats = await getAllHeats(competition.id);
    const harvestFestHeat = allHeats.find((heat) => heat.type === 'harvestFest');
    const isHarvestFestHeat = harvestFestHeat !== undefined && (
        now >= harvestFestHeat.startTime.getTime() &&
        now < harvestFestHeat.endTime.getTime() + CLOSING_TIME
    );



    let gridSection: ReactNode;

    if (competitor) {
        const boulders = await getBouldersWithResults(competition.id, competitor.id);
        let baseline: Record<number, BoulderStatus> | null = null;
        const heatNumber = isHarvestFestHeat ? 'Dożynkowa' : competitor.heatNumber;
        const activeHeat = isHarvestFestHeat ? harvestFestHeat : competitor;
        const openingTime = activeHeat.startTime;
        const endingTime = activeHeat.endTime;
        const closingTime = new Date(endingTime.getTime() + CLOSING_TIME);

        if (isHarvestFestHeat) {
            const changes = await getHarvestFestChanges(competitor.id);
            const changesMap = new Map(changes.map((c) => [c.boulderId, c.previousStatus]));
            baseline = Object.fromEntries(boulders.map(
                (b) => [b.id, changesMap.get(b.id) ?? getBoulderStatus(b)]
            ))
        }

        gridSection = (
            <>
                <Panel>
                    <div className={'flex items-start justify-between gap-4'}>
                        <div className={'flex flex-col'}>
                            <p className={'text-lg'}>Cześć,</p>
                            <h2 className={'text-7xl font-display pb-4'}>{getFirstName(competitor.name)}!</h2>
                        </div>
                        <SignOutButton slug={slug} className={cn(pressableClass, 'px-3 py-1.5 text-base')}/>
                    </div>
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
                    <Countdown
                        steps={[
                            {until: openingTime, label: 'Do startu grupy pozostało:'},
                            {until: endingTime, label: 'Do końca grupy pozostało:'},
                            {until: closingTime, label: 'Do końca wpisywania wyników pozostało:'},
                        ]}
                        doneLabel={'Grupa zakończona.'}
                    />
                    {competitors.length > 1 && (
                        <nav className={'flex gap-2'}>
                            {competitors.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/zawody/${slug}/wyniki?zawodnik=${c.id}`}
                                    scroll={false}
                                    aria-current={c.id === competitor.id ? 'page' : undefined}
                                    className={cn(pressableClass,
                                        c.id === competitor.id ? 'bg-black text-white' : 'bg-white',
                                        'py-2 text-lg'
                                    )}
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
                        heatStartTime={activeHeat.startTime}
                        heatEndTime={activeHeat.endTime}
                        baseline={baseline}
                    />
                </Panel>
            </>
        )
    } else {
        gridSection = (
            <Panel className={'flex flex-col text-center gap-2'}>
                <h1 className={'font-display text-4xl'}>Nie ma Cię na liście uczestników.</h1>
                <p>
                    Zalogowano jako:{' '}
                    <span className={'font-semibold'}>{session.user.email}</span>
                </p>
                <p>
                    Wyloguj się i zaloguj mailem podanym przy zapisie na zawody.
                    Jeżeli mail jest poprawny zgłoś się do biura zawodów.
                </p>
                <SignOutButton slug={slug} className={cn('text-2xl', pressableClass)}/>
            </Panel>
        )
    }

    return gridSection;
}