import 'dotenv/config';
import {eq, inArray} from 'drizzle-orm';
import {db} from '@/src/db/index';
import {boulder, competition, competitor, heat, result} from '@/src/db/schema';
import {getLeaderboard} from '@/src/db/queries/leaderboard';

const SLUG = 'test-rankingu';
const HOUR = 60 * 60 * 1000;

type Gender = 'k' | 'm';
type Category = 'adult' | 'kids';
type Tick = [boulderNumber: number, status: 'zone' | 'top' | 'flash'];

type TestCompetitor = {
    name: string;
    gender: Gender;
    category: Category;
    ticks: Tick[];
};

type Expected = {
    place: number;
    name: string;
    pointsSum: number;
    flashCount: number;
};

const range = (from: number, to: number) => Array.from({length: to - from + 1}, (_, i) => from + i);

const BOULDER_GRADES: [number: number, grade: number][] = [
    ...range(1, 25).map((n): [number, number] => [n, 5]),
    [26, 9],
    [27, 9],
];

const COMPETITORS: TestCompetitor[] = [
    {
        name: 'Edek Granica',
        gender: 'm',
        category: 'adult',
        ticks: [...range(1, 20).map((n): Tick => [n, 'top']), [21, 'flash']],
    },
    {
        name: 'Darek Dwadzieścia',
        gender: 'm',
        category: 'adult',
        ticks: range(1, 22).map((n): Tick => [n, 'top']),
    },
    {
        name: 'Bartek Remis',
        gender: 'm',
        category: 'adult',
        ticks: [[1, 'flash'], [2, 'flash'], [3, 'top'], [4, 'top'], [5, 'top']],
    },
    {
        name: 'Czarek Exaequo',
        gender: 'm',
        category: 'adult',
        ticks: [[6, 'flash'], [7, 'flash'], [8, 'top'], [9, 'top'], [10, 'top']],
    },
    {
        name: 'Adam Remis',
        gender: 'm',
        category: 'adult',
        ticks: [[1, 'flash'], [2, 'top'], [3, 'top'], [4, 'top'], [5, 'top']],
    },
    {
        name: 'Filip Strefa',
        gender: 'm',
        category: 'adult',
        ticks: [[26, 'zone'], [27, 'top']],
    },
    {
        name: 'Igor Bezwyników',
        gender: 'm',
        category: 'adult',
        ticks: [],
    },
    {
        name: 'Gosia Kobieta',
        gender: 'k',
        category: 'adult',
        ticks: range(1, 25).map((n): Tick => [n, 'flash']),
    },
    {
        name: 'Henio Dziecko',
        gender: 'm',
        category: 'kids',
        ticks: range(1, 25).map((n): Tick => [n, 'flash']),
    },
];

const EXPECTED: Record<string, Expected[]> = {
    'adult / m': [
        {place: 1, name: 'Edek Granica', pointsSum: 400, flashCount: 1},
        {place: 2, name: 'Darek Dwadzieścia', pointsSum: 400, flashCount: 0},
        {place: 3, name: 'Bartek Remis', pointsSum: 100, flashCount: 2},
        {place: 3, name: 'Czarek Exaequo', pointsSum: 100, flashCount: 2},
        {place: 5, name: 'Adam Remis', pointsSum: 100, flashCount: 1},
        {place: 6, name: 'Filip Strefa', pointsSum: 63, flashCount: 0},
    ],
    'adult / k': [
        {place: 1, name: 'Gosia Kobieta', pointsSum: 400, flashCount: 20},
    ],
    'kids / m': [
        {place: 1, name: 'Henio Dziecko', pointsSum: 400, flashCount: 20},
    ],
    'kids / k': [],
};

const statusFlags = {
    zone: {isZone: true, isTop: false, isFlash: false},
    top: {isZone: true, isTop: true, isFlash: false},
    flash: {isZone: true, isTop: true, isFlash: true},
};

async function removePreviousRun() {
    const [previous] = await db.select({id: competition.id}).from(competition).where(eq(competition.slug, SLUG));
    if (!previous) {
        return;
    }

    const competitors = await db
        .select({id: competitor.id})
        .from(competitor)
        .where(eq(competitor.competitionId, previous.id));
    const competitorIds = competitors.map((c) => c.id);

    if (competitorIds.length > 0) {
        await db.delete(result).where(inArray(result.competitorId, competitorIds));
        await db.delete(competitor).where(inArray(competitor.id, competitorIds));
    }
    await db.delete(boulder).where(eq(boulder.competitionId, previous.id));
    await db.delete(heat).where(eq(heat.competitionId, previous.id));
    await db.delete(competition).where(eq(competition.id, previous.id));
}

async function seed() {
    const now = Date.now();
    const today = new Date(now).toLocaleDateString('en-CA', {timeZone: 'Europe/Warsaw'});

    const [created] = await db
        .insert(competition)
        .values({
            name: 'Test rankingu',
            slug: SLUG,
            startDate: today,
            endDate: today,
            zoneMultiplier: 3,
            topMultiplier: 4,
        })
        .returning();

    const [createdHeat] = await db
        .insert(heat)
        .values({
            number: 1,
            type: 'qualification',
            competitionId: created.id,
            startTime: new Date(now - HOUR),
            endTime: new Date(now + 12 * HOUR),
        })
        .returning();

    const createdBoulders = await db
        .insert(boulder)
        .values(BOULDER_GRADES.map(([number, grade]) => ({number, grade, competitionId: created.id})))
        .returning();
    const boulderIdByNumber = new Map(createdBoulders.map((b) => [b.number, b.id]));

    const createdCompetitors = await db
        .insert(competitor)
        .values(
            COMPETITORS.map((c, i) => ({
                userId: null,
                externalId: `ranking-${i + 1}`,
                email: `ranking${i + 1}@example.com`,
                name: c.name,
                gender: c.gender,
                category: c.category,
                birthDate: c.category === 'kids' ? '2016-01-01' : '1995-01-01',
                heatId: createdHeat.id,
                competitionId: created.id,
            })),
        )
        .returning();

    const resultRows = createdCompetitors.flatMap((created, i) =>
        COMPETITORS[i].ticks.map(([boulderNumber, status]) => ({
            competitorId: created.id,
            boulderId: boulderIdByNumber.get(boulderNumber)!,
            ...statusFlags[status],
        })),
    );

    await db.insert(result).values(resultRows);

    return created.id;
}

function compare(label: string, actual: Expected[], expected: Expected[]) {
    const sortKey = (row: Expected) => `${row.place}|${row.name}`;
    const actualSorted = [...actual].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const expectedSorted = [...expected].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

    const failures: string[] = [];

    if (actualSorted.length !== expectedSorted.length) {
        failures.push(`liczba wierszy: jest ${actualSorted.length}, powinno być ${expectedSorted.length}`);
    }

    for (const want of expectedSorted) {
        const got = actualSorted.find((row) => row.name === want.name);
        if (!got) {
            failures.push(`brak zawodnika ${want.name}`);
            continue;
        }
        for (const key of ['place', 'pointsSum', 'flashCount'] as const) {
            if (got[key] !== want[key]) {
                failures.push(`${want.name}: ${key} jest ${got[key]}, powinno być ${want[key]}`);
            }
        }
    }

    for (const got of actualSorted) {
        if (!expectedSorted.some((row) => row.name === got.name)) {
            failures.push(`zawodnik, którego nie powinno być: ${got.name}`);
        }
    }

    console.log(`\n${failures.length === 0 ? 'OK  ' : 'BŁĄD'} ${label}`);
    console.table(actual.map(({place, name, pointsSum, flashCount}) => ({place, name, pointsSum, flashCount})));
    failures.forEach((failure) => console.log(`  - ${failure}`));

    return failures.length === 0;
}

async function main() {
    const host = new URL(process.env.DATABASE_URL ?? '').host;
    console.log(`Baza: ${host}`);

    await removePreviousRun();
    const competitionId = await seed();

    const groups: [Category, Gender][] = [['adult', 'm'], ['adult', 'k'], ['kids', 'm'], ['kids', 'k']];
    let allPassed = true;

    for (const [category, gender] of groups) {
        const leaderboard = await getLeaderboard(competitionId, category, gender);
        const passed = compare(`${category} / ${gender}`, leaderboard, EXPECTED[`${category} / ${gender}`]);
        allPassed &&= passed;
    }

    console.log(allPassed ? '\nWszystkie testy przeszły.' : '\nNiektóre testy nie przeszły.');
    process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});