'use server';

import {harvestFestChange, result} from "@/src/db/schema";
import {auth} from "@/src/lib/auth";
import {db} from "@/src/db";

import {
    BOULDER_STATUSES,
    CLOSING_TIME, getBoulderStatus, HARVEST_FEST_CHANGE_LIMIT,
    isBoulderStatus, RESULT_REVEAL_DELAY,
    SaveResultResponse,
    statusFlags
} from "@/src/lib/boulders-state";
import {getCompetitor} from "@/src/db/queries/competitors";
import {getBoulder} from "@/src/db/queries/boulders";
import {revalidatePath} from "next/cache";
import {headers} from "next/headers";
import {and, eq} from "drizzle-orm";
import {getAllHeats} from "@/src/db/queries/heats";

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
    const closingTime = competitor.endTime.getTime() + CLOSING_TIME;

    const allHeats = await getAllHeats(boulder.competitionId);
    const harvestFestHeat = allHeats.find((heat) => heat.type === 'harvestFest');
    const isHarvestFestHeat = harvestFestHeat && (
        now >= harvestFestHeat.startTime.getTime() &&
        now < harvestFestHeat.endTime.getTime() + CLOSING_TIME
    );

    if (!isHarvestFestHeat) {
        if (now < competitor.startTime.getTime()) {
            return {ok: false, reason: 'not_started'};
        } else if (now > closingTime) {
            return {ok: false, reason: 'closed'};
        }
    }

    if (isHarvestFestHeat) {
        const [current] = await db.select({
            isZone: result.isZone,
            isTop: result.isTop,
            isFlash: result.isFlash
        })
            .from(result)
            .where(and(
                eq(result.competitorId, competitor.id),
                eq(result.boulderId, boulder.id)
            ));

        const currentStatus = current ? getBoulderStatus(current) : 'none';

        const [change] = await db.select({
            previousStatus: harvestFestChange.previousStatus
        })
            .from(harvestFestChange)
            .where(and(
                eq(harvestFestChange.competitorId, competitor.id),
                eq(harvestFestChange.boulderId, boulder.id)
            ));

        const baseStatus = change?.previousStatus ?? currentStatus;

        if (BOULDER_STATUSES.indexOf(boulderStatus) < BOULDER_STATUSES.indexOf(baseStatus)) {
            return {ok: false, reason: 'harvest_fest_lower'};
        }

        if (boulderStatus === 'flash' && (baseStatus === 'zone' || baseStatus === 'top')) {
            return {ok: false, reason: 'harvest_fest_flash'};
        }

        if (!change && boulderStatus !== baseStatus) {
            const changesCount = await db.$count(
                harvestFestChange,
                eq(harvestFestChange.competitorId, competitor.id));

            if (changesCount >= HARVEST_FEST_CHANGE_LIMIT) {
                return {ok: false, reason: 'harvest_fest_limit'};
            }
        }

        if (change && boulderStatus === baseStatus) {
            await db.delete(harvestFestChange).where(and(
                eq(harvestFestChange.competitorId, competitor.id),
                eq(harvestFestChange.boulderId, boulder.id)
            ));
        } else if (!change && boulderStatus !== baseStatus) {
            await db.insert(harvestFestChange)
                .values({
                    competitorId: competitor.id,
                    boulderId: boulder.id,
                    previousStatus: baseStatus
                })
                .onConflictDoNothing();

            const changesAfterInsert = await db.$count(
                harvestFestChange,
                eq(harvestFestChange.competitorId, competitor.id)
            );

            if (changesAfterInsert > HARVEST_FEST_CHANGE_LIMIT) {
                await db.delete(harvestFestChange).where(and(
                    eq(harvestFestChange.competitorId, competitor.id),
                    eq(harvestFestChange.boulderId, boulder.id)
                ));
                return {ok: false, reason: 'harvest_fest_limit'};
            }
        }
    }

    if (boulderStatus === 'none') {
        await db.delete(result).where(and(
            eq(result.competitorId, competitor.id),
            eq(result.boulderId, boulder.id)
        ));
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
            });
    }

    revalidatePath(`/zawody/${boulder.competitionSlug}/wyniki`);
    revalidatePath(`/zawody/${boulder.competitionSlug}`);

    return {ok: true};
}
