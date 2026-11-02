import "server-only";

import {db} from "@/src/db";
import {boulder, competition, result} from "@/src/db/schema";

import {eq, and} from "drizzle-orm";

export async function getBoulder(boulderId: number) {
    const [row] = await db.select({
        id: boulder.id,
        competitionId: boulder.competitionId,
        competitionSlug: competition.slug
    })
        .from(boulder)
        .leftJoin(competition, eq(boulder.competitionId, competition.id))
        .where(eq(boulder.id, boulderId))
        .limit(1)

    return row;
}

export async function getBouldersWithResults(competitionId: number, competitorId: number) {
    return db.select({
        id: boulder.id,
        number: boulder.number,
        grade: boulder.grade,
        isZone: result.isZone,
        isTop: result.isTop,
        isFlash: result.isFlash
    })
        .from(boulder)
        .leftJoin(result, and(eq(boulder.id, result.boulderId), eq(result.competitorId, competitorId)))
        .where(eq(boulder.competitionId, competitionId))
        .orderBy(boulder.number)
}