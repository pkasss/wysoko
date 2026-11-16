import {getAllHeats} from "@/src/db/queries/heats";
import {getCompetition} from "@/src/db/queries/competitions";
import {Panel} from "@/src/components/Panel";
import {formatDate, formatTime} from "@/src/lib/dates";

export async function HeatSchedule({slug}: {slug: string}) {
    const competition = await getCompetition(slug);
    const allHeats = await getAllHeats(competition.id);

    const heatsByDay = new Map<string, typeof allHeats[number][]>();
    for (const heat of allHeats) {
        const key = formatDate(heat.startTime);
        const value = heatsByDay.get(key) ?? [];
        value.push(heat);
        heatsByDay.set(key, value);
    }

    return (
        <Panel className={'flex flex-col gap-4'}>
            <h1 className={'font-display text-4xl'}>Grupy</h1>
            {[...heatsByDay].map(([day, heats]) => (
                <section key={day}>
                    <h3 className={'text-xs font-semibold uppercase tracking-wide text-black/90 mb-1'}>{day}</h3>
                    {heats.map((heat) => (
                        <ul key={heat.id}>
                            <li className={'flex justify-between py-2 border-t border-black/10 text-sm'}>
                                <p className={'font-semibold text-base'}>Grupa {heat.number ?? 'dożynkowa'}</p>
                                <p className={'text-base tabular-nums'}>{formatTime(heat.startTime)}–{formatTime(heat.endTime)}</p>
                            </li>
                        </ul>
                    ))}
                </section>
            ))}
        </Panel>
    )
}