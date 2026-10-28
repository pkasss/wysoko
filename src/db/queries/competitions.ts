import "server-only";

import {db} from "@/src/db";
import {competition} from "@/src/db/schema";
import {desc, eq} from "drizzle-orm";

export async function getCompetitions() {
    return db.select({
        id: competition.id,
        name: competition.name,
        startDate: competition.startDate,
        endDate: competition.endDate,
    })
        .from(competition)
        .orderBy(desc(competition.startDate));
}

export async function getCompetition(competitionId: number) {
    const [newCompetition] = await db.select({
        id: competition.id,
        name: competition.name,
        startDate: competition.startDate,
        endDate: competition.endDate
    })
        .from(competition)
        .where(eq(competition.id, competitionId))
        .limit(1);

    return newCompetition;
}