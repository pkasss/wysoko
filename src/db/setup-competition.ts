import 'dotenv/config';
import {eq} from 'drizzle-orm';
import {db} from './index';
import {boulder, competition, heat} from './schema';

const COMPETITION = {
    name: "KRAK'EM ALL 2026",
    slug: 'krak-em-all-2026',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    zoneMultiplier: 3,
    topMultiplier: 4,
};

const QUALIFICATION_HEATS: [number: number, day: string, start: string, end: string][] = [
    [1, '2026-11-20', '08:00', '10:45'],
    [2, '2026-11-20', '11:00', '13:45'],
    [3, '2026-11-20', '14:15', '17:00'],
    [4, '2026-11-20', '17:15', '20:00'],
    [5, '2026-11-20', '20:30', '23:15'],
    [6, '2026-11-21', '08:00', '10:45'],
    [7, '2026-11-21', '11:00', '13:45'],
    [8, '2026-11-21', '14:15', '17:00'],
    [9, '2026-11-21', '17:15', '20:00'],
    [10, '2026-11-21', '20:30', '23:15'],
];

const HARVEST_FEST: [day: string, start: string, end: string] = ['2026-11-22', '09:00', '12:00'];

const GRADE_DISTRIBUTION: [grade: number, count: number][] = [
    [2, 3],
    [3, 8],
    [4, 8],
    [5, 8],
    [6, 8],
    [7, 7],
    [8, 4],
    [9, 4],
];

const warsawTime = (day: string, time: string) => new Date(`${day}T${time}:00+01:00`);

const formatTime = (date: Date) => date.toLocaleString('pl-PL', {timeZone: 'Europe/Warsaw'});

async function main() {
    const host = new URL(process.env.DATABASE_URL ?? '').host;
    console.log(`Baza: ${host}`);

    const existing = await db
        .select({id: competition.id})
        .from(competition)
        .where(eq(competition.name, COMPETITION.name));

    if (existing.length > 0) {
        throw new Error(`Zawody "${COMPETITION.name}" już istnieją (id ${existing[0].id}). Nic nie zmieniono.`);
    }

    const grades = GRADE_DISTRIBUTION.flatMap(([grade, count]) => Array<number>(count).fill(grade));

    const [created] = await db.insert(competition).values(COMPETITION).returning();

    const createdHeats = await db
        .insert(heat)
        .values([
            ...QUALIFICATION_HEATS.map(([number, day, start, end]) => ({
                number,
                type: 'qualification' as const,
                competitionId: created.id,
                startTime: warsawTime(day, start),
                endTime: warsawTime(day, end),
            })),
            {
                number: null,
                type: 'harvestFest' as const,
                competitionId: created.id,
                startTime: warsawTime(HARVEST_FEST[0], HARVEST_FEST[1]),
                endTime: warsawTime(HARVEST_FEST[0], HARVEST_FEST[2]),
            },
        ])
        .returning();

    const createdBoulders = await db
        .insert(boulder)
        .values(grades.map((grade, i) => ({number: i + 1, grade, competitionId: created.id})))
        .returning();

    console.log(`\nUtworzono: ${created.name} (id ${created.id})`);
    createdHeats.forEach((h) =>
        console.log(`  grupa ${h.number ?? 'Dożynkowa'}: ${formatTime(h.startTime)} – ${formatTime(h.endTime)}`),
    );
    console.log(`  bouldery: ${createdBoulders.length}`);
    console.log(`\nImport zawodników: npx tsx --conditions=react-server src/db/import-competit.ts <plik> ${created.id}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });