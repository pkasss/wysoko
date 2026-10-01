import 'dotenv/config';
import {randomBytes, randomUUID} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from './index';
import {competition, competitor, boulder, result} from './schema';
import {user} from './auth-schema';

const BOULDER_COUNT = 40;
const MIN_RESULTS = 8;
const MAX_RESULTS = 35;

const people = [
    'Anna Nowak',
    'Kuba Kowalski',
    'Ola Wiśniewska',
    'Michał Wójcik',
    'Zosia Kamińska',
    'Bartek Lewandowski',
    'Kasia Zielińska',
    'Tomek Szymański',
    'Marta Woźniak',
    'Paweł Dąbrowski',
    'Julia Kozłowska',
    'Adam Jankowski',
];

const makeToken = () => randomBytes(6).toString('base64url');

const shuffle = <T, >(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

async function main() {
    await db.execute(
        sql`truncate table result, competitor, boulder, competition, session, account, verification, "user" restart identity`,
    );

    const [newCompetition] = await db
        .insert(competition)
        .values({
            name: 'Testowe Zawody',
            date: '2026-10-01',
            zoneMultiplier: 1,
            topMultiplier: 2,
        })
        .returning();

    const insertedBoulders = await db
        .insert(boulder)
        .values(
            Array.from({length: BOULDER_COUNT}, (_, i) => ({
                number: i + 1,
                grade: Math.min(9, Math.ceil(((i + 1) * 9) / BOULDER_COUNT)),
                competitionId: newCompetition.id,
            })),
        )
        .returning();

    const insertedUsers = await db
        .insert(user)
        .values(
            people.map((name, i) => ({
                id: randomUUID(),
                name,
                email: `zawodnik${i + 1}@example.com`,
            })),
        )
        .returning();

    const insertedCompetitors = await db
        .insert(competitor)
        .values(
            insertedUsers.map((u) => ({
                token: makeToken(),
                userId: u.id,
                competitionId: newCompetition.id,
            })),
        )
        .returning();

    const resultCounts = insertedCompetitors.map((_, i) =>
        Math.round(MIN_RESULTS + (i * (MAX_RESULTS - MIN_RESULTS)) / (insertedCompetitors.length - 1)),
    );

    const resultRows = insertedCompetitors.flatMap((c, i) => {
        const skill = Math.random();

        return shuffle(insertedBoulders)
            .slice(0, resultCounts[i])
            .map((b) => {
                const difficulty = b.number / BOULDER_COUNT;
                const isZone = Math.random() > 0.1;
                const isTop = isZone && Math.random() < skill - difficulty + 0.5;

                return {competitorId: c.id, boulderId: b.id, isZone, isTop};
            });
    });

    await db.insert(result).values(resultRows);

    console.log(`Zawody: ${newCompetition.name} (id ${newCompetition.id})`);
    console.log(`Bouldery: ${insertedBoulders.length}, zawodnicy: ${insertedCompetitors.length}, wyniki: ${resultRows.length}`);
    console.log('Zawodnicy (id, liczba wyników, token):');
    insertedCompetitors.forEach((c, i) =>
        console.log(`  ${c.id}. ${people[i]}: ${resultCounts[i]} wyników, token ${c.token}`),
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });