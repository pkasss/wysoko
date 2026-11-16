import {Panel} from "@/src/components/Panel";
import {StatTile} from "@/src/components/StatTile";
import {statusStyle} from "@/src/lib/boulders-state";
import {HeatSchedule} from "@/src/components/HeatSchedule";

export default async function Info({params}: {params: {slug: string}}) {

    const {slug} = await params;

    return (
        <>
            <Panel className={'flex flex-col gap-4 w-full'}>
                <h2 className={'font-display text-4xl'}>Punktacja</h2>
                <div className={'grid grid-cols-2 gap-4'}>
                    <StatTile
                        label={'Zona'}
                        value={'wycena × 3'}
                        className={statusStyle['zone'].className}
                    />
                    <StatTile
                        label={'Top i Flesz'}
                        value={'wycena × 4'}
                        className={statusStyle['top'].className}
                    />
                </div>
                <ul className={'list-disc pl-5 space-y-1'}>
                    <li>Do wyniku liczy się 20 najlepszych boulderów.</li>
                    <li>W przypadku remisu wyżej jest osoba z większą liczbą fleszy wśród tych 20 boulderów.</li>
                    <li>Wyniki wpisujesz w trakcie swojej grupy i 20 minut po jej zakończeniu.</li>
                </ul>
            </Panel>
            <HeatSchedule slug={slug}/>
        </>
    )
}