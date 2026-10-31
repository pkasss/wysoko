import "server-only";

import {db} from "@/src/db";
import {user} from "@/src/db/auth-schema";
import {eq} from "drizzle-orm";

export async function getUserEmail(userId: string) {
    const [userEmail] = await db.select({
        email: user.email
    })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

    return userEmail?.email;
}