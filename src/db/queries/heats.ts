import "server-only";

import {db} from "@/src/db";
import {harvestFestChange, heat} from "@/src/db/schema";

import {cache} from "react";
import {eq} from "drizzle-orm";

export const getAllHeats = cache(async (competitionId: number) => {
    return db.select({
        id: heat.id,
        number: heat.number,
        type: heat.type,
        startTime: heat.startTime,
        endTime: heat.endTime
    })
        .from(heat)
        .where(eq(heat.competitionId, competitionId))
        .orderBy(heat.startTime, heat.number)
});

export async function getHarvestFestChanges(competitorId: number) {
    return db.select({
        boulderId: harvestFestChange.boulderId,
        previousStatus: harvestFestChange.previousStatus
    })
        .from(harvestFestChange)
        .where(eq(harvestFestChange.competitorId, competitorId));
}