import "server-only";

import {db} from "@/src/db";
import {competitor} from "@/src/db/schema";
import {and, eq, isNull, sql} from "drizzle-orm";

export async function getCompetitor(userId: string, competitionId: number) {
    const [newCompetitor] = await db.select({
        id: competitor.id
    })
        .from(competitor)
        .where(and(eq(competitor.userId, userId), eq(competitor.competitionId, competitionId)))
        .limit(1);

    return newCompetitor;
}

export async function getUnlinkedCompetitors(email:string) {
    return await db.select({
        id: competitor.id,
        competitionId: competitor.competitionId,
    })
        .from(competitor)
        .where(and(isNull(competitor.userId), eq(sql`lower(${competitor.email})`, email.toLowerCase())));
}
