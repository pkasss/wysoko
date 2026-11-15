import "server-only";

import {db} from "@/src/db";
import {competitor, heat} from "@/src/db/schema";
import {and, eq} from "drizzle-orm";

export async function getCompetitors(userId: string, competitionId: number) {
    return db.select({
        id: competitor.id,
        name: competitor.name,
        heatNumber: heat.number,
        startTime: heat.startTime,
        endTime: heat.endTime,
        category: competitor.category,
        gender: competitor.gender
    })
        .from(competitor)
        .innerJoin(heat, eq(competitor.heatId, heat.id))
        .where(and(eq(competitor.userId, userId), eq(competitor.competitionId, competitionId)))
        .orderBy(competitor.id)
}

type CompetitorParams = {competitorId: number, userId: string, competitionId: number}

export async function getCompetitor({competitorId, userId, competitionId}: CompetitorParams) {
    const [row] = await db.select({
        id: competitor.id,
        name: competitor.name,
        startTime: heat.startTime,
        endTime: heat.endTime,
    })
        .from(competitor)
        .innerJoin(heat, eq(competitor.heatId, heat.id))
        .where(and(eq(competitor.id, competitorId), eq(competitor.userId, userId), eq(competitor.competitionId, competitionId)))
        .limit(1);

    return row;
}