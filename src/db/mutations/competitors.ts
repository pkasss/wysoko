import "server-only";

import {getUnlinkedCompetitors} from "@/src/db/queries/competitors";
import {and, inArray, isNull} from "drizzle-orm";

import {competitor} from "@/src/db/schema";
import {db} from "@/src/db";

export async function linkCompetitorsToUser(userId: string, email: string) {
    const unlinkedCompetitors = await getUnlinkedCompetitors(email);

    const counts = new Map<number, number>();
    for (const c of unlinkedCompetitors) {
        counts.set(c.competitionId, (counts.get(c.competitionId) ?? 0) + 1);
    }

    const unique = unlinkedCompetitors.filter(
        (c) => counts.get(c.competitionId) === 1
    );
    const idOnly = unique.map((c) => c.id)

    if (idOnly.length === 0) {
        return;
    }

    await db.update(competitor)
        .set({userId})
        .where(and(inArray(competitor.id, idOnly), isNull(competitor.userId)));
}