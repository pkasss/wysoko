import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from './index';
import {competition, competitor, heat, boulder, result} from './schema';
import {user} from './auth-schema';

const MY_EMAIL = (process.env.SEED_MY_EMAIL ?? 'twoj-mail@example.com').trim().toLowerCase();

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

const REAL_HEATS: [number: number, day: string, start: string, end: string][] = [
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

const HOUR = 60 * 60 * 1000;
const TEST_HEAT_LENGTH = 2.75 * HOUR;
const LINKED_COUNT = 10;

const people: [name: string, gender: 'k' | 'm'][] = [
    ['Anna Nowak', 'k'], ['Kuba Kowalski', 'm'], ['Ola Wiśniewska', 'k'], ['Michał Wójcik', 'm'],
    ['Zosia Kamińska', 'k'], ['Bartek Lewandowski', 'm'], ['Kasia Zielińska', 'k'], ['Tomek Szymański', 'm'],
    ['Marta Woźniak', 'k'], ['Paweł Dąbrowski', 'm'], ['Julia Kozłowska', 'k'], ['Adam Jankowski', 'm'],
    ['Natalia Mazur', 'k'], ['Piotr Krawczyk', 'm'], ['Weronika Piotrowska', 'k'], ['Kamil Grabowski', 'm'],
    ['Magda Pawlak', 'k'], ['Szymon Michalski', 'm'], ['Ewa Król', 'k'], ['Mateusz Wieczorek', 'm'],
    ['Karolina Jabłońska', 'k'], ['Jakub Wróbel', 'm'], ['Ania Nowakowska', 'k'], ['Wojtek Majewski', 'm'],
    ['Ala Olszewska', 'k'], ['Filip Stępień', 'm'], ['Hania Malinowska', 'k'], ['Marcin Jaworski', 'm'],
];

const familyMembers: [name: string, gender: 'k' | 'm', birthDate: string][] = [
    ['Lena Testowa', 'k', '2015-04-12'],
    ['Staś Testowy', 'm', '2017-09-03'],
];

const warsawTime = (day: string, time: string) => new Date(`${day}T${time}:00+01:00`);

const toDateString = (date: Date) => date.toLocaleDateString('en-CA', {timeZone: 'Europe/Warsaw'});

const shuffle = <T, >(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const randomBirthDate = () => {
    const year = 1980 + Math.floor(Math.random() * 30);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const randomTimeBetween = (from: Date, to: Date) =>
    new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));

const grades = GRADE_DISTRIBUTION.flatMap(([grade, count]) => Array<number>(count).fill(grade));

const insertBoulders = (competitionId: number) =>
    db
        .insert(boulder)
        .values(grades.map((grade, i) => ({number: i + 1, grade, competitionId})))
        .returning();

async function seedRealCompetition() {
    const [krakemAll] = await db
        .insert(competition)
        .values({
            name: "KRAK'EM ALL 2026",
            startDate: '2026-11-20',
            endDate: '2026-11-22',
            zoneMultiplier: 3,
            topMultiplier: 4,
        })
        .returning();

    const insertedHeats = await db
        .insert(heat)
        .values([
            ...REAL_HEATS.map(([number, day, start, end]) => ({
                number,
                type: 'qualification' as const,
                competitionId: krakemAll.id,
                startTime: warsawTime(day, start),
                endTime: warsawTime(day, end),
            })),
            {
                number: null,
                type: 'harvestFest' as const,
                competitionId: krakemAll.id,
                startTime: warsawTime(HARVEST_FEST[0], HARVEST_FEST[1]),
                endTime: warsawTime(HARVEST_FEST[0], HARVEST_FEST[2]),
            },
        ])
        .returning();

    await insertBoulders(krakemAll.id);

    return {krakemAll, insertedHeats};
}

async function seedTestCompetition() {
    const now = new Date();

    const [testCompetition] = await db
        .insert(competition)
        .values({
            name: 'Testowe Zawody',
            startDate: toDateString(new Date(now.getTime() - 24 * HOUR)),
            endDate: toDateString(new Date(now.getTime() + 24 * HOUR)),
            zoneMultiplier: 3,
            topMultiplier: 4,
        })
        .returning();

    const insertedHeats = await db
        .insert(heat)
        .values([
            ...[-9, -6].map((hours, i) => {
                const start = new Date(now.getTime() + hours * HOUR);
                return {
                    number: i + 1,
                    type: 'qualification' as const,
                    competitionId: testCompetition.id,
                    startTime: start,
                    endTime: new Date(start.getTime() + TEST_HEAT_LENGTH),
                };
            }),
            {
                number: 3,
                type: 'qualification' as const,
                competitionId: testCompetition.id,
                startTime: new Date(now.getTime() - HOUR),
                endTime: new Date(now.getTime() + 12 * HOUR),
            },
            {
                number: 4,
                type: 'qualification' as const,
                competitionId: testCompetition.id,
                startTime: new Date(now.getTime() + 14 * HOUR),
                endTime: new Date(now.getTime() + 14 * HOUR + TEST_HEAT_LENGTH),
            },
            {
                number: null,
                type: 'harvestFest' as const,
                competitionId: testCompetition.id,
                startTime: new Date(now.getTime() + 20 * HOUR),
                endTime: new Date(now.getTime() + 23 * HOUR),
            },
        ])
        .returning();

    const qualificationHeats = insertedHeats.filter((h) => h.type === 'qualification');
    const currentHeat = qualificationHeats.find((h) => h.startTime <= now && now <= h.endTime)!;
    const insertedBoulders = await insertBoulders(testCompetition.id);

    const linkedUsers = await db
        .insert(user)
        .values(
            people.slice(0, LINKED_COUNT).map(([name], i) => ({
                id: randomUUID(),
                name,
                email: `zawodnik${i + 1}@example.com`,
            })),
        )
        .returning();

    const insertedCompetitors = await db
        .insert(competitor)
        .values([
            ...people.map(([name, gender], i) => ({
                userId: linkedUsers[i]?.id ?? null,
                externalId: String(1001 + i),
                email: `zawodnik${i + 1}@example.com`,
                name,
                gender,
                category: 'adult' as const,
                birthDate: randomBirthDate(),
                heatId: qualificationHeats[i % qualificationHeats.length].id,
                competitionId: testCompetition.id,
            })),
            ...familyMembers.map(([name, gender, birthDate], i) => ({
                userId: null,
                externalId: String(2001 + i),
                email: MY_EMAIL,
                name,
                gender,
                category: 'kids' as const,
                birthDate,
                heatId: currentHeat.id,
                competitionId: testCompetition.id,
            })),
            {
                userId: null,
                externalId: '3001',
                email: MY_EMAIL,
                name: 'Testowy Ja',
                gender: 'm' as const,
                category: 'adult' as const,
                birthDate: '1999-01-01',
                heatId: currentHeat.id,
                competitionId: testCompetition.id,
            },
        ])
        .returning();

    const heatById = new Map(insertedHeats.map((h) => [h.id, h]));

    const resultRows = insertedCompetitors
        .filter((c) => c.externalId !== '3001' && c.externalId !== '2002')
        .flatMap((c) => {
            const competitorHeat = heatById.get(c.heatId)!;

            if (competitorHeat.startTime > now) {
                return [];
            }

            const windowEnd = competitorHeat.endTime < now ? competitorHeat.endTime : now;
            const elapsed = Math.min(1, (windowEnd.getTime() - competitorHeat.startTime.getTime()) / TEST_HEAT_LENGTH);
            const skill = Math.random();
            const count = Math.round((10 + Math.random() * 35) * elapsed);

            return shuffle(insertedBoulders)
                .slice(0, count)
                .map((b) => {
                    const difficulty = (b.grade - 2) / 7;
                    const isZone = Math.random() > 0.1;
                    const isTop = isZone && Math.random() < skill - difficulty + 0.6;
                    const isFlash = isTop && Math.random() < skill - difficulty + 0.2;

                    return {
                        competitorId: c.id,
                        boulderId: b.id,
                        isZone,
                        isTop,
                        isFlash,
                        updatedAt: randomTimeBetween(competitorHeat.startTime, windowEnd),
                    };
                });
        });

    if (resultRows.length > 0) {
        await db.insert(result).values(resultRows);
    }

    return {testCompetition, insertedHeats, currentHeat, insertedCompetitors, resultRows};
}

async function main() {
    await db.execute(
        sql`truncate table result, competitor, heat, boulder, competition, session, account, verification, "user" restart identity`,
    );

    const formatTime = (date: Date) => date.toLocaleString('pl-PL', {timeZone: 'Europe/Warsaw'});

    const real = await seedRealCompetition();
    const test = await seedTestCompetition();

    console.log(`${real.krakemAll.name} (id ${real.krakemAll.id}) – bez zawodników, do testowania importu`);
    real.insertedHeats.forEach((h) =>
        console.log(`  grupa ${h.number ?? 'Dożynkowa'}: ${formatTime(h.startTime)} – ${formatTime(h.endTime)}`),
    );

    console.log(`\n${test.testCompetition.name} (id ${test.testCompetition.id}) – do testowania siatki`);
    test.insertedHeats.forEach((h) =>
        console.log(`  grupa ${h.number ?? 'Dożynkowa'}: ${formatTime(h.startTime)} – ${formatTime(h.endTime)}${h.id === test.currentHeat.id ? '  ← trwa teraz' : ''}`),
    );
    console.log(`  zawodnicy: ${test.insertedCompetitors.length} (połączonych z kontem: ${LINKED_COUNT}), wyniki: ${test.resultRows.length}`);
    console.log(`  na Twoim mailu (${MY_EMAIL}), grupa ${test.currentHeat.number}:`);
    console.log('    Testowy Ja (adult, bez wyników)');
    console.log('    Lena Testowa (kids, z wynikami)');
    console.log('    Staś Testowy (kids, bez wyników)');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });