import {ReactNode} from "react";
import {notFound} from "next/navigation";
import {getCompetition} from "@/src/db/queries/competitions";
import {Panel} from "@/src/components/Panel";
import BottomNav from "@/src/components/BottomNav";

export default async function CompetitionLayout({
    params, children
}: {
    params: Promise<{ slug: string }>,
    children: ReactNode;
}) {

    const {slug} = await params;

    const competition =  await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const competitionDate = new Intl.DateTimeFormat('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})
        .formatRange(new Date(`${competition.startDate}T12:00:00`), new Date(`${competition.endDate}T12:00:00`));

    return (
        <main className={'flex flex-col gap-3 mx-auto max-w-xl px-4 pb-28'}>
            <Panel className={'w-fit px-3 py-1 text-lg uppercase'}>
                {competitionDate}
            </Panel>
            <Panel className={'text-8xl font-display'}>{competition.name}</Panel>
            {children}
            <BottomNav slug={slug}/>
        </main>
    );
}