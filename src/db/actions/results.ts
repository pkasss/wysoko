'use server';

import {result} from "@/src/db/schema";
import {auth} from "@/src/lib/auth";
import {db} from "@/src/db";

import {isBoulderStatus, SaveResultResponse, statusFlags} from "@/src/lib/boulders-state";
import {getCompetitor} from "@/src/db/queries/competitors";
import {getBoulder} from "@/src/db/queries/boulders";
import {revalidatePath} from "next/cache";
import {headers} from "next/headers";
import {and, eq} from "drizzle-orm";

const RESULT_ENTRY_TIME_MS = 20 * 60 * 1000;

type SaveResultParams = {competitorId: number, boulderId: number, boulderStatus: string}

export async function saveResult(
    {competitorId, boulderId, boulderStatus}: SaveResultParams): Promise<SaveResultResponse> {
    if (!Number.isInteger(competitorId) || !Number.isInteger(boulderId) || !isBoulderStatus(boulderStatus)) {
        return {ok: false, reason: 'invalid'};
    }

    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return {ok: false, reason: 'unauthorized'};
    }

    const boulder = await getBoulder(boulderId);
    if (!boulder) {
        return {ok: false, reason: 'not_found'};
    }

    const competitor = await getCompetitor(
        {competitorId, userId: session.user.id, competitionId: boulder.competitionId}
    );
    if (!competitor) {
        return {ok: false, reason: 'not_competitor'};
    }

    const now = new Date().getTime();

    const closingTime = competitor.endTime.getTime() + RESULT_ENTRY_TIME_MS;

    if (now < competitor.startTime.getTime()) {
        return {ok: false, reason: 'not_started'};
    } else if (now > closingTime) {
        return {ok: false, reason: 'closed'};
    }

    if (boulderStatus === 'none') {
        await db.delete(result).where(and(
            eq(result.competitorId, competitor.id),
            eq(result.boulderId, boulder.id)
        ))
    } else {
        await db.insert(result)
            .values(
                {
                    competitorId: competitor.id,
                    boulderId: boulder.id,
                    ...statusFlags[boulderStatus],
                    updatedAt: new Date()
                }
            ).onConflictDoUpdate({
                target: [result.competitorId, result.boulderId],
                set: {
                    ...statusFlags[boulderStatus],
                    updatedAt: new Date()
                }
            })
    }

    revalidatePath(`/zawody/${boulder.competitionSlug}`)

    return {ok: true}
}
