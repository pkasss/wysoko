import 'dotenv/config';
import {eq, inArray} from 'drizzle-orm';
import {db} from './index';
import {boulder, competition, competitor, heat, result} from './schema';

const SLUG = 'test-krakem-all';
const NAME = "TEST KRAK'EM ALL";
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const QUALIFICATION_LENGTH = 165 * MINUTE;
const HARVEST_FEST_LENGTH = 180 * MINUTE;
const RESULTS_REVEAL_DELAY = 15 * MINUTE;

const DAILY_HEAT_STARTS = ['8:00', '11:00', '14:15', '17:15', '20:30'];
const QUALIFICATION_DAYS = 2;
const HARVEST_FEST_DAY = 2;
const HARVEST_FEST_START = '9:00';

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

const toDateString = (date: Date) => date.toLocaleDateString('en-CA', {timeZone: 'Europe/Warsaw'});

const formatTime = (date: Date) => date.toLocaleString('pl-PL', {timeZone: 'Europe/Warsaw'});

function toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
}

const FIRST_HEAT_START = toMinutes(DAILY_HEAT_STARTS[0] ?? '8:00');

function offsetFromFirstHeat(day: number, time: string) {
    return day * DAY + (toMinutes(time) - FIRST_HEAT_START) * MINUTE;
}

const HARVEST_FEST_OFFSET = offsetFromFirstHeat(HARVEST_FEST_DAY, HARVEST_FEST_START);

type HeatTimes = {start: Date; end: Date};

type Schedule = {
    qualification: (number: number) => HeatTimes;
    harvestFest: HeatTimes;
};

function minutesSinceMidnightInWarsaw(date: Date) {
    const time = date.toLocaleTimeString('en-GB', {timeZone: 'Europe/Warsaw', hour12: false});
    return toMinutes(time);
}

function buildSchedule(mode: string | undefined, lengthArg: string | undefined): Schedule {
    const now = new Date(Math.floor(Date.now() / MINUTE) * MINUTE);
    const after = (base: Date, offset: number) => new Date(base.getTime() + offset);

    if (mode === undefined) {
        const midnight = after(now, (24 * 60 - minutesSinceMidnightInWarsaw(now)) * MINUTE);
        const end = after(midnight, -MINUTE);
        const harvestFestStart = after(midnight, toMinutes(HARVEST_FEST_START) * MINUTE);
        return {
            qualification: () => ({start: now, end}),
            harvestFest: {start: harvestFestStart, end: after(harvestFestStart, HARVEST_FEST_LENGTH)},
        };
    }

    if (mode === 'harmonogram') {
        return {
            qualification: (number) => {
                const day = Math.floor((number - 1) / DAILY_HEAT_STARTS.length);
                const time = DAILY_HEAT_STARTS[(number - 1) % DAILY_HEAT_STARTS.length] ?? '8:00';
                const start = after(now, offsetFromFirstHeat(day, time));
                return {start, end: after(start, QUALIFICATION_LENGTH)};
            },
            harvestFest: {
                start: after(now, HARVEST_FEST_OFFSET),
                end: after(now, HARVEST_FEST_OFFSET + HARVEST_FEST_LENGTH),
            },
        };
    }

    if (mode === 'dozynkowa') {
        const minutes = lengthArg === undefined ? HARVEST_FEST_LENGTH / MINUTE : Number(lengthArg);
        if (!Number.isInteger(minutes) || minutes <= 0) {
            throw new Error('Długość Dożynkowej podaj w minutach, np. create dozynkowa 10');
        }
        const qualificationEnd = after(now, -60 * MINUTE);
        return {
            qualification: () => ({start: after(qualificationEnd, -QUALIFICATION_LENGTH), end: qualificationEnd}),
            harvestFest: {start: now, end: after(now, minutes * MINUTE)},
        };
    }

    throw new Error(`Nieznany tryb: ${mode}. Dostępne: create, create harmonogram, create dozynkowa [minuty]`);
}

async function findTestCompetition() {
    const [found] = await db.select({id: competition.id}).from(competition).where(eq(competition.slug, SLUG));
    return found;
}

async function create(mode: string | undefined, lengthArg: string | undefined) {
    if (await findTestCompetition()) {
        throw new Error(`Zawody testowe (${SLUG}) już istnieją. Najpierw je usuń: remove`);
    }

    const schedule = buildSchedule(mode, lengthArg);
    const heatNumbers = Array.from({length: QUALIFICATION_DAYS * DAILY_HEAT_STARTS.length}, (_, i) => i + 1);
    const firstHeat = schedule.qualification(1);

    const [created] = await db
        .insert(competition)
        .values({
            name: NAME,
            slug: SLUG,
            startDate: toDateString(firstHeat.start),
            endDate: toDateString(schedule.harvestFest.end),
            zoneMultiplier: 3,
            topMultiplier: 4,
        })
        .returning();

    const qualificationHeats = heatNumbers.map((number) => {
        const {start, end} = schedule.qualification(number);
        return {
            number,
            type: 'qualification' as const,
            competitionId: created.id,
            startTime: start,
            endTime: end,
        };
    });

    const createdHeats = await db
        .insert(heat)
        .values([
            ...qualificationHeats,
            {
                number: null,
                type: 'harvestFest' as const,
                competitionId: created.id,
                startTime: schedule.harvestFest.start,
                endTime: schedule.harvestFest.end,
            },
        ])
        .returning();

    const grades = GRADE_DISTRIBUTION.flatMap(([grade, count]) => Array<number>(count).fill(grade));
    await db.insert(boulder).values(grades.map((grade, i) => ({number: i + 1, grade, competitionId: created.id})));

    console.log(`\nUtworzono: ${created.name} (id ${created.id}, /zawody/${SLUG})`);
    createdHeats.forEach((h) =>
        console.log(`  grupa ${h.number ?? 'Dożynkowa'}: ${formatTime(h.startTime)} – ${formatTime(h.endTime)}`),
    );
    console.log(`  bouldery: ${grades.length}`);
    console.log(
        `  ranking ukryty: ${formatTime(schedule.harvestFest.start)} – ${formatTime(new Date(schedule.harvestFest.end.getTime() + RESULTS_REVEAL_DELAY))}`,
    );
    console.log(`\nImport: npx tsx --conditions=react-server src/db/import-competit.ts <plik> ${SLUG}`);
}

async function remove() {
    const found = await findTestCompetition();
    if (!found) {
        console.log(`Nie ma zawodów testowych (${SLUG}). Nic nie usunięto.`);
        return;
    }

    const competitors = await db
        .select({id: competitor.id})
        .from(competitor)
        .where(eq(competitor.competitionId, found.id));
    const competitorIds = competitors.map((c) => c.id);

    if (competitorIds.length > 0) {
        await db.delete(result).where(inArray(result.competitorId, competitorIds));
        await db.delete(competitor).where(inArray(competitor.id, competitorIds));
    }
    await db.delete(boulder).where(eq(boulder.competitionId, found.id));
    await db.delete(heat).where(eq(heat.competitionId, found.id));
    await db.delete(competition).where(eq(competition.id, found.id));

    console.log(`Usunięto zawody testowe (id ${found.id}) i ${competitorIds.length} zawodników z wynikami.`);
}

async function main() {
    const host = new URL(process.env.DATABASE_URL ?? '').host;
    console.log(`Baza: ${host}`);

    const command = process.argv[2];
    if (command === 'create') {
        await create(process.argv[3], process.argv[4]);
    } else if (command === 'remove') {
        await remove();
    } else {
        throw new Error('Podaj polecenie: create, create harmonogram, create dozynkowa [minuty] albo remove');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });