import {ReactNode} from "react";
import Image from "next/image";
import {auth} from "@/src/lib/auth";
import {getCompetition} from "@/src/db/queries/competitions";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import {Panel} from "@/src/components/Panel";
import {Toaster} from '@/src/components/ui/sonner';
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

    const competition = await getCompetition(slug);
    if (!competition) {
        notFound();
    }

    const competitionDate = new Intl.DateTimeFormat('pl-PL', {day: 'numeric', month: 'long', year: 'numeric'})
        .formatRange(new Date(`${competition.startDate}T12:00:00`), new Date(`${competition.endDate}T12:00:00`));

    return (
        <main className={'flex flex-col gap-3 mx-auto max-w-xl px-4 pt-2 pb-28'}>
            <div
                style={{viewTransitionName: 'site-header'}}
                className={`sticky top-0 z-20 -mx-4 flex justify-center bg-background/90 px-4
                             pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur`}>
                <Image
                    src={'/avatar-logo-full.svg'}
                    alt={'Avatar Climbing'}
                    width={920}
                    height={644}
                    priority
                    className={'h-(--header-height) w-auto dark:invert'}
                />
            </div>
            <Panel className={'w-fit px-3 py-1 text-lg uppercase'}>
                {competitionDate}
            </Panel>
            <Panel className={'text-7xl font-display'}>{competition.name}</Panel>
            <Toaster
                position={'bottom-center'}
                mobileOffset={{bottom: '7rem'}}
                offset={{bottom: '7rem'}}
                visibleToasts={3}
                toastOptions={{
                    classNames: {
                        toast: 'rounded-2xl! border-2! border-black! bg-white! text-black! shadow-[4px_4px_0_var(--color-black)]! font-sans! gap-3!',
                        title: 'font-display! text-4xl! leading-none! tracking-wide!',
                        description: 'text-xl! text-black/70!',
                        error: 'bg-zone! text-on-zone!',
                        icon: 'text-black! text-xl!',
                    },
                }}
            />
            {children}
            {session && (
                <BottomNav slug={slug}/>
            )}
        </main>
    );
}