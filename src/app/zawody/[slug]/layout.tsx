import {ReactNode} from "react";
import Image from "next/image";
import {auth} from "@/src/lib/auth";
import {getCompetition} from "@/src/db/queries/competitions";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {Panel} from "@/src/components/Panel";
import {BottomNav} from "@/src/components/BottomNav";

export default async function CompetitionLayout({
    params, children
}: {
    params: Promise<{ slug: string }>,
    children: ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {slug} = await params;

    const competition =  await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const competitionDate = new Intl.DateTimeFormat('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})
        .formatRange(new Date(`${competition.startDate}T12:00:00`), new Date(`${competition.endDate}T12:00:00`));

    return (
        <main className={'flex flex-col gap-3 mx-auto max-w-xl px-4 pt-2 pb-28'}>
            <div className={`sticky top-0 z-20 -mx-4 flex justify-center bg-[whitesmoke]/90 px-4
                             pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur`}>
                <Image
                    src={'/avatar-logo-full.svg'}
                    alt={'Avatar Climbing'}
                    width={920}
                    height={644}
                    priority
                    className={'h-20 w-auto'}
                />
            </div>
            <Panel className={'w-fit px-3 py-1 text-lg uppercase'}>
                {competitionDate}
            </Panel>
            <Panel className={'text-6xl font-display'}>{competition.name}</Panel>
            {children}
            {session && (
                <BottomNav slug={slug}/>
            )}
        </main>
    );
}