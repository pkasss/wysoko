import "server-only";

import {db} from "@/src/db";
import {heat} from "@/src/db/schema";

import {eq} from "drizzle-orm";

export async function getAllHeats(competitionId: number) {
    return db.select({
        id: heat.id,
        number: heat.number
    })
        .from(heat)
        .where(eq(heat.competitionId, competitionId))
}