'use server';

import {db} from  "@/src/db";
import {auth} from "@/src/lib/auth";
import {competitor} from "@/src/db/schema";

import {headers} from "next/headers";
import {randomBytes} from "node:crypto";
import {getToday} from "@/src/lib/dates";
import {revalidatePath} from "next/cache";
import {notFound, redirect} from "next/navigation";
import {getCompetition} from "@/src/db/queries/competitions";

export async function joinCompetition(competitionId: number) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/login");
    }

    if (!session.user.name) {
        redirect("/welcome");
    }

    const competition = await getCompetition(competitionId);
    const today = getToday();
    if (!competition || competition.endDate < today) {
        notFound();
    }

    await db.insert(competitor).values({
        token: randomBytes(6).toString('base64url'),
        userId: session.user.id,
        competitionId
    }).onConflictDoNothing();

    revalidatePath(`/zawody/${competitionId}`);
}