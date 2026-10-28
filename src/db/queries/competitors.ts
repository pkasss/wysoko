import "server-only";

import {db} from "@/src/db";
import {competitor} from "@/src/db/schema";
import {and, eq} from "drizzle-orm";

export async function getCompetitor(userId: string, competitionId: number) {
    const [newCompetitor] = await db.select({
        id: competitor.id
    })
        .from(competitor)
        .where(and(eq(competitor.userId, userId), eq(competitor.competitionId, competitionId)))
        .limit(1);

    return newCompetitor;
}
