import "server-only";

import {competitor} from "@/src/db/schema";
import {db} from "@/src/db";

import {eq} from "drizzle-orm";

export async function linkCompetitorsToUser(userId: string, email: string) {
    await db.update(competitor)
        .set({userId})
        .where(eq(competitor.email, email.toLocaleLowerCase('pl')));
}