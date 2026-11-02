import "server-only";

import {db} from "@/src/db";
import {competition} from "@/src/db/schema";
import {desc, eq} from "drizzle-orm";

export async function getCompetitions() {
    return db.select({
        id: competition.id,
        name: competition.name,
        startDate: competition.startDate,
        endDate: competition.endDate,
    })
        .from(competition)
        .orderBy(desc(competition.startDate));
}

export async function getCompetition(slug: string) {
    const [row] = await db.select({
        id: competition.id,
        name: competition.name,
        slug: competition.slug,
        startDate: competition.startDate,
        endDate: competition.endDate
    })
        .from(competition)
        .where(eq(competition.slug, slug))
        .limit(1);

    return row;
}