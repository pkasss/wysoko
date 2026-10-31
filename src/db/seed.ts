import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from './index';
import {competition, competitor, heat, boulder, result} from './schema';
import {user} from './auth-schema';

const MY_EMAIL = process.env.SEED_MY_EMAIL ?? 'example@mail.com';

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

const HOUR = 60 * 60 * 1000;
const HEAT_LENGTH = 2.75 * HOUR;
const LINKED_COUNT = 10;

const people: [name: string, sex: 'k' | 'm'][] = [
    ['Anna Nowak', 'k'], ['Kuba Kowalski', 'm'], ['Ola Wiśniewska', 'k'], ['Michał Wójcik', 'm'],
    ['Zosia Kamińska', 'k'], ['Bartek Lewandowski', 'm'], ['Kasia Zielińska', 'k'], ['Tomek Szymański', 'm'],
    ['Marta Woźniak', 'k'], ['Paweł Dąbrowski', 'm'], ['Julia Kozłowska', 'k'], ['Adam Jankowski', 'm'],
    ['Natalia Mazur', 'k'], ['Piotr Krawczyk', 'm'], ['Weronika Piotrowska', 'k'], ['Kamil Grabowski', 'm'],
    ['Magda Pawlak', 'k'], ['Szymon Michalski', 'm'], ['Ewa Król', 'k'], ['Mateusz Wieczorek', 'm'],
    ['Karolina Jabłońska', 'k'], ['Jakub Wróbel', 'm'], ['Ania Nowakowska', 'k'], ['Wojtek Majewski', 'm'],
    ['Ala Olszewska', 'k'], ['Filip Stępień', 'm'], ['Hania Malinowska', 'k'], ['Marcin Jaworski', 'm'],
];

const familyMembers: [name: string, sex: 'k' | 'm', birthDate: string][] = [
    ['Lena Rodzic', 'k', '2015-04-12'],
    ['Staś Rodzic', 'm', '2017-09-03'],
];

const shuffle = <T, >(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const toDateString = (date: Date) => date.toLocaleDateString('en-CA', {timeZone: 'Europe/Warsaw'});

const randomBirthDate = () => {
    const year = 1980 + Math.floor(Math.random() * 30);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const randomTimeBetween = (from: Date, to: Date) =>
    new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));

async function main() {
    await db.execute(
        sql`truncate table result, competitor, heat, boulder, competition, session, account, verification, "user" restart identity`,
    );

    const now = new Date();

    const [ongoing] = await db
        .insert(competition)
        .values({
            name: 'Testowe Zawody',
            startDate: toDateString(new Date(now.getTime() - 24 * HOUR)),
            endDate: toDateString(new Date(now.getTime() + 24 * HOUR)),
            zoneMultiplier: 3,
            topMultiplier: 4,
        })
        .returning();

    await db.insert(competition).values({
        name: 'Zeszłoroczne Zawody',
        startDate: toDateString(new Date(now.getTime() - 365 * 24 * HOUR)),
        endDate: toDateString(new Date(now.getTime() - 363 * 24 * HOUR)),
        zoneMultiplier: 3,
        topMultiplier: 4,
    });

    const heatStarts = [-6, -3, -1, 2].map((hours) => new Date(now.getTime() + hours * HOUR));

    const insertedHeats = await db
        .insert(heat)
        .values([
            ...heatStarts.map((start, i) => ({
                number: i + 1,
                type: 'qualification' as const,
                competitionId: ongoing.id,
                startTime: start,
                endTime: new Date(start.getTime() + HEAT_LENGTH),
            })),
            {
                number: null,
                type: 'harvestFest' as const,
                competitionId: ongoing.id,
                startTime: new Date(now.getTime() + 20 * HOUR),
                endTime: new Date(now.getTime() + 23 * HOUR),
            },
        ])
        .returning();

    const qualificationHeats = insertedHeats.filter((h) => h.type === 'qualification');
    const currentHeat = qualificationHeats.find((h) => h.startTime <= now && now <= h.endTime)!;

    const grades = GRADE_DISTRIBUTION.flatMap(([grade, count]) => Array<number>(count).fill(grade));

    const insertedBoulders = await db
        .insert(boulder)
        .values(
            grades.map((grade, i) => ({
                number: i + 1,
                grade,
                competitionId: ongoing.id,
            })),
        )
        .returning();

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

    const competitorRows = [
        ...people.map(([name, sex], i) => ({
            userId: linkedUsers[i]?.id ?? null,
            externalId: String(1001 + i),
            email: `zawodnik${i + 1}@example.com`,
            name,
            sex,
            birthDate: randomBirthDate(),
            heatId: qualificationHeats[i % qualificationHeats.length].id,
            competitionId: ongoing.id,
        })),
        ...familyMembers.map(([name, sex, birthDate], i) => ({
            userId: null,
            externalId: String(2001 + i),
            email: 'rodzic@example.com',
            name,
            sex,
            birthDate,
            heatId: qualificationHeats[0].id,
            competitionId: ongoing.id,
        })),
        {
            userId: null,
            externalId: '3001',
            email: MY_EMAIL,
            name: 'Testowy Ja',
            sex: 'm' as const,
            birthDate: '1999-01-01',
            heatId: currentHeat.id,
            competitionId: ongoing.id,
        },
    ];

    const insertedCompetitors = await db.insert(competitor).values(competitorRows).returning();

    const heatById = new Map(insertedHeats.map((h) => [h.id, h]));

    const resultRows = insertedCompetitors
        .filter((c) => c.email !== MY_EMAIL)
        .flatMap((c) => {
            const competitorHeat = heatById.get(c.heatId)!;

            if (competitorHeat.startTime > now) {
                return [];
            }

            const windowEnd = competitorHeat.endTime < now ? competitorHeat.endTime : now;
            const elapsed = (windowEnd.getTime() - competitorHeat.startTime.getTime()) / HEAT_LENGTH;
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

    const maxScore = 4 * [...grades].sort((a, b) => b - a).slice(0, 20).reduce((sum, g) => sum + g, 0);
    const formatTime = (date: Date) => date.toLocaleString('pl-PL', {timeZone: 'Europe/Warsaw'});

    console.log(`Trwające: ${ongoing.name} (id ${ongoing.id}), ${ongoing.startDate} – ${ongoing.endDate}`);
    console.log('Grupy:');
    insertedHeats.forEach((h) =>
        console.log(`  ${h.number ?? 'Dożynkowa'}: ${formatTime(h.startTime)} – ${formatTime(h.endTime)}${h.id === currentHeat.id ? '  ← trwa teraz' : ''}`),
    );
    console.log(`Bouldery: ${insertedBoulders.length}, zawodnicy: ${insertedCompetitors.length} (połączonych z kontem: ${LINKED_COUNT}), wyniki: ${resultRows.length}`);
    console.log(`Maksymalny możliwy wynik: ${maxScore}`);
    console.log(`Twój testowy zawodnik: ${MY_EMAIL}, grupa ${currentHeat.number}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });