import "server-only";

import {db} from "@/src/db";
import {competitor, heat} from "@/src/db/schema";
import {and, eq, isNull, sql} from "drizzle-orm";

export async function getCompetitor(userId: string, competitionId: number) {
    const [row] = await db.select({
        id: competitor.id,
        name: competitor.name,
        startTime: heat.startTime,
        endTime: heat.endTime,
    })
        .from(competitor)
        .innerJoin(heat, eq(competitor.heatId, heat.id))
        .where(and(eq(competitor.userId, userId), eq(competitor.competitionId, competitionId)))
        .limit(1);

    return row;
}

export async function getUnlinkedCompetitors(email:string) {
    return await db.select({
        id: competitor.id,
        competitionId: competitor.competitionId,
    })
        .from(competitor)
        .where(and(isNull(competitor.userId), eq(sql`lower(${competitor.email})`, email.toLowerCase())));
}
