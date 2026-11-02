import fs from "node:fs";

import {competitor, genderType} from "@/src/db/schema";
import {db} from "@/src/db/index";

import {getCompetition} from "@/src/db/queries/competitions";
import {getAllHeats} from "@/src/db/queries/heats";
import {normalizeName} from "@/src/lib/names";
import {sql} from "drizzle-orm";

const args = process.argv.slice(2);
const IMPORT_DATA_COLUMNS = [
    'id',
    'imie',
    'nazwisko',
    'data urodzenia',
    'email',
    'plec',
    'kategoria',
    'platnosc',
    'grupa',
] as const;

const GENDERS = genderType.enumValues;
type Gender = (typeof GENDERS)[number];

function isGender(value: string): value is Gender {
    return (GENDERS as readonly string[]).includes(value);
}

const numberToCategory = new Map<string, 'adult' | 'kids'>([
    ['1', 'adult'],
    ['2', 'kids']
]);

const MAX_ADULT_BIRTH_YEAR = 2012;

type ImportDataRow = Record<typeof IMPORT_DATA_COLUMNS[number], string>

async function main() {
    if (!args[0]) {
        throw new Error('Nieprawidłowa ścieżka do pliku z importu.')
    }

    const importData = fs.readFileSync(args[0], "utf-8");
    const slug = args[1];

    const lines = importData
        .split(/\r?\n/)
        .filter((line) => line !== '');

    const header = lines[0].split('\t');
    const missing = IMPORT_DATA_COLUMNS.filter((column) => !header.includes(column));

    if (missing.length > 0) {
        throw new Error(`Brakuje kolumn ${missing.join(', ')}`)
    }

    const participants = lines.slice(1).map((line) => {
        const cell = line.split('\t');

        return Object.fromEntries(
            IMPORT_DATA_COLUMNS.map(
                (column) => [column, cell[header.indexOf(column)]]
            )
        ) as ImportDataRow;
    });

    const participantsWithPayment = participants.filter((participant) => participant.platnosc === '1');
    if (participantsWithPayment.length === 0) {
        throw new Error(`Brak uczestników z opłaconym startem.`)
    }

    const competition = await getCompetition(slug);
    if (!competition) {
        throw new Error(`Nie znaleziono zawodów o slug: ${slug}`);
    }

    const heats = await getAllHeats(competition.id);
    const heatsMap = new Map<number, number>();

    for (const heat of heats) {
        if (heat.number !== null) {
            heatsMap.set(heat.number, heat.id)
        }
    }

    const warnings: string[] = [];

    const competitorsFromImport = participantsWithPayment.map((participant) => {
        const heatId = heatsMap.get(Number(participant.grupa));
        if (heatId === undefined) {
            throw new Error(`Nieznana grupa ${participant.grupa} dla uczestnika ${participant.id}`);
        }

        const gender = participant.plec;
        if (!isGender(gender)) {
            throw new Error(`Nieznana płeć ${gender} dla uczestnika ${participant.id}`);
        }

        const category = numberToCategory.get(participant.kategoria)
        if (category === undefined) {
            throw new Error(`Nieznana kategoria ${participant.kategoria} dla uczestnika ${participant.id}`);
        }

        const birthDate = participant['data urodzenia'].replace('\'', '');
        const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
        if (!DATE_PATTERN.test(birthDate)) {
            throw new Error(`Nieprawidłowa data urodzenia "${participant['data urodzenia']}" uczestnika ${participant.id}`);
        }

        const birthYear = Number(birthDate.split('-')[0]);

        const presumedCategory = birthYear <= MAX_ADULT_BIRTH_YEAR ? 'adult' : 'kids';
        if (presumedCategory !== category) {
            const lines = [
                `Zawodnik z rokiem urodzenia ${birthYear} w kategorii ${category}:`,
                `${participant.id} ${participant.imie} ${participant.nazwisko} ${birthDate}`
            ];

            warnings.push(lines.join('\n'));
        }

        return {
            externalId: participant.id,
            email: participant.email.trim().toLocaleLowerCase('pl'),
            name: `${normalizeName(participant.imie.trim())} ${normalizeName(participant.nazwisko.trim())}`,
            gender,
            category,
            birthDate,
            heatId,
            competitionId: competition.id
        }
    });

    await db
        .insert(competitor)
        .values(competitorsFromImport)
        .onConflictDoUpdate({
            target: [competitor.externalId, competitor.competitionId],
            set: {
                userId: sql`case when ${competitor.email} <> excluded.email then null else ${competitor.userId} end`,
                email: sql`excluded.email`,
                name: sql`excluded.name`,
                gender: sql`excluded.gender`,
                category: sql`excluded.category`,
                birthDate: sql`excluded."birthDate"`,
                heatId: sql`excluded."heatId"`
            }
        })

    console.log(`W pliku: ${participants.length}`);
    console.log(`Bez płatności (pominięci): ${participants.length - participantsWithPayment.length}`);
    console.log(`Zapisanych lub zaktualizowanych: ${competitorsFromImport.length}`);
    if (warnings.length > 0) {
        console.warn(`Znaleziono ostrzeżenia (${warnings.length}) w przypisaniu kategorii:`);
        warnings.forEach(warning => {
            console.warn(warning);
        })
    }

}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })