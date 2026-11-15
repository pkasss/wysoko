import 'dotenv/config';
import {eq, inArray} from 'drizzle-orm';
import {db} from './index';
import {boulder, competition, competitor, heat, result} from './schema';

const SLUG = 'test-krakem-all';
const NAME = "TEST KRAK'EM ALL";
const MINUTE = 60 * 1000;
const QUALIFICATION_HEATS = 10;
const QUALIFICATION_LENGTH = 165 * MINUTE;
const HARVEST_FEST_LENGTH = 180 * MINUTE;

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

async function findTestCompetition() {
    const [found] = await db.select({id: competition.id}).from(competition).where(eq(competition.slug, SLUG));
    return found;
}

async function create() {
    if (await findTestCompetition()) {
        throw new Error(`Zawody testowe (${SLUG}) już istnieją. Najpierw je usuń: remove`);
    }

    const start = new Date(Math.floor(Date.now() / MINUTE) * MINUTE);

    const [created] = await db
        .insert(competition)
        .values({
            name: NAME,
            slug: SLUG,
            startDate: toDateString(start),
            endDate: toDateString(new Date(start.getTime() + 24 * 60 * MINUTE)),
            zoneMultiplier: 3,
            topMultiplier: 4,
        })
        .returning();

    const createdHeats = await db
        .insert(heat)
        .values([
            ...Array.from({length: QUALIFICATION_HEATS}, (_, i) => ({
                number: i + 1,
                type: 'qualification' as const,
                competitionId: created.id,
                startTime: start,
                endTime: new Date(start.getTime() + QUALIFICATION_LENGTH),
            })),
            {
                number: null,
                type: 'harvestFest' as const,
                competitionId: created.id,
                startTime: start,
                endTime: new Date(start.getTime() + HARVEST_FEST_LENGTH),
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
    console.log(`\nImport: npx tsx --conditions=react-server src/db/import-competit.ts <plik> ${created.id}`);
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
        await create();
    } else if (command === 'remove') {
        await remove();
    } else {
        throw new Error('Podaj polecenie: create albo remove');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });