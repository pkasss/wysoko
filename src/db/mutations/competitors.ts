import "server-only";

import {competitor} from "@/src/db/schema";
import {user} from "@/src/db/auth-schema";
import {db} from "@/src/db";

import {eq, and, sql} from "drizzle-orm";

export async function linkCompetitorsToUser(userId: string, email: string) {
    await db.update(competitor)
        .set({userId})
        .where(eq(competitor.email, email.toLocaleLowerCase('pl')));
}

export async function linkCompetitionToUsers(competitionId: number) {
    const linked = await db
        .update(competitor)
        .set({userId: sql`${user.id}`})
        .from(user)
        .where(and(
            eq(competitor.competitionId, competitionId),
            eq(competitor.email, sql`lower(${user.email})`),
        ))
        .returning({id: competitor.id});

    return linked.length;
}