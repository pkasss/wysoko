import "server-only";

import {desc, eq, lte, sql} from 'drizzle-orm';
import {db} from '@/src/db'
import {boulder, competition, result} from '@/src/db/schema';

const points = sql<number>
    `
            case 
                when ${result.isTop} = true then ${boulder.grade} * ${competition.topMultiplier}   
                when ${result.isZone} = true then ${boulder.grade} * ${competition.zoneMultiplier}
                else 0
            end
        `
    .mapWith(Number);

const rowNumber = sql<number>
    `
            row_number() over (partition by ${result.competitorId} order by ${desc(points)})
        `
    .mapWith(Number)
    .as('rowNumber');

export async function getLeaderboard() {
    const allResults = db.select({
        competitorId: result.competitorId,
        points: points.as('points'),
        row_numer: rowNumber
    })
        .from(result)
        .innerJoin(boulder, eq(result.boulderId, boulder.id))
        .innerJoin(competition, eq(boulder.competitionId, competition.id))
        .where(eq(competition.id, 1))
        .as('allResults');

    const total = sql<number>`sum(${allResults.points})`.mapWith(Number);

    return await db.select({
        competitorId: allResults.competitorId,
        total
    })
        .from(allResults)
        .where(lte(allResults.row_numer, 20))
        .groupBy(allResults.competitorId)
        .orderBy(desc(total));
}