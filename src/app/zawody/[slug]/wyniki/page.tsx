import {ReactNode} from "react";

import Link from "next/link";
import {auth} from "@/src/lib/auth";
import {CLOSING_TIME} from "@/src/lib/boulders-state";
import {getCompetition} from "@/src/db/queries/competitions";

import {cn} from "@/src/lib/utils"
import {headers} from "next/headers";
import {notFound, redirect} from "next/navigation";
import {getFirstName} from "@/src/lib/names";
import {Panel, pressableClass} from "@/src/components/Panel";
import {Countdown} from "@/src/components/Countdown";
import {formatTime} from "@/src/lib/dates";
import {BouldersGrid} from "@/src/components/BouldersGrid";
import {getCompetitors} from "@/src/db/queries/competitors";
import {getBouldersWithResults} from "@/src/db/queries/boulders";
import {SignOutButton} from "@/src/components/SignOutButton";

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

    let gridSection: ReactNode;

    if (competitor) {

        const boulders = await getBouldersWithResults(competition.id, competitor.id);
        const heatNumber = competitor.heatNumber ?? 'Dożynkowa';
        const openingTime = competitor.startTime;
        const endingTime = competitor.endTime;
        const closingTime = new Date(endingTime.getTime() + CLOSING_TIME);

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
                    <Countdown startTime={competitor.startTime} endTime={competitor.endTime}/>
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
                        heatStartTime={competitor.startTime}
                        heatEndTime={competitor.endTime}
                    />
                </Panel>
            </>
        )
    } else {
        gridSection = (
            <Panel className={'flex flex-col text-center gap-2'}>
                <h1 className={'font-display text-4xl'}>Nie ma Cię na liście uczestników.</h1>
                <p>
                    Jesteś zalogowany jako:{' '}
                    <span className={'font-semibold'}>{session.user.email}</span>
                </p>
                <p>
                    Wyloguj się i zaloguj mailem podanym przy zapisie na zawody.
                    Jeżeli podałeś poprawnego maila zgłoś się do biura zawodów.
                </p>
                <SignOutButton slug={slug} className={cn('text-2xl', pressableClass)}/>
            </Panel>
        )
    }

    return gridSection;
}