'use server';

import {db} from "@/src/db";
import {competitor} from "@/src/db/schema";
import {getAllHeats} from "@/src/db/queries/heats";
import {eq} from "drizzle-orm";
import {areResultsHidden} from "@/src/lib/ranking";
import {getBouldersWithResults} from "@/src/db/queries/boulders";
import {CompetitorBouldersResponse, getBoulderStatus} from "@/src/lib/boulders-state";

export async function getCompetitorBoulders(competitorId: number): Promise<CompetitorBouldersResponse> {
    if (!Number.isInteger(competitorId)) {
        return {ok: false}
    }

    const [found] = await db.select({competitionId: competitor.competitionId})
        .from(competitor)
        .where(eq(competitor.id, competitorId));

    if (!found) {
        return {ok: false}
    }

    const allHeats = await getAllHeats(found.competitionId);
    const harvestFestHeat = allHeats.find((heat) => heat.type === 'harvestFest');

    if (harvestFestHeat && areResultsHidden(harvestFestHeat)) {
        return {ok: false}
    }

    const bouldersWithResults = await getBouldersWithResults(found.competitionId, competitorId);

    return {
        ok: true,
        boulders: bouldersWithResults.map((boulder) => ({
            id: boulder.id,
            number: boulder.number,
            grade: boulder.grade,
            status: getBoulderStatus(boulder)
        }))
    };
}