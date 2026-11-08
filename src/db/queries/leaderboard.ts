import "server-only";

import {desc, eq, and, lte, sql} from 'drizzle-orm';
import {db} from '@/src/db'
import {competitor, boulder, competition, result, type Category, type Gender} from '@/src/db/schema';

const points = sql<number>
        `
            case
                when ${result.isTop} then ${boulder.grade} * ${competition.topMultiplier}
                when ${result.isZone} then ${boulder.grade} * ${competition.zoneMultiplier}
                else 0
            end
        `
    .mapWith(Number);

const rowNumber = sql<number>
        `
            row_number() over (partition by ${result.competitorId} order by ${desc(points)}, ${desc(result.isFlash)})
        `
    .mapWith(Number)
    .as('rowNumber');

export async function getLeaderboard(competitionId: number, category: Category, gender: Gender) {
    const ranked = db.select({
        competitorId: result.competitorId,
        boulderId: result.boulderId,
        grade: boulder.grade,
        isZone: result.isZone,
        isTop: result.isTop,
        isFlash: result.isFlash,
        points: points.as('points'),
        rowNumber: rowNumber
    })
        .from(result)
        .innerJoin(boulder, eq(result.boulderId, boulder.id))
        .innerJoin(competitor, eq(result.competitorId, competitor.id))
        .innerJoin(competition, eq(boulder.competitionId, competition.id))
        .where(and(
            eq(competitor.competitionId, competitionId),
            eq(competitor.category, category),
            eq(competitor.gender, gender)
        ))
        .as('ranked');

    const pointsSum = sql<number>`sum(${ranked.points})`.mapWith(Number);
    const flashCount = sql<number>`count(*) filter (where ${ranked.isFlash})`.mapWith(Number);
    const place = sql<number>`rank() over (order by ${pointsSum} desc, ${flashCount} desc)`.mapWith(Number);

    return db.select({
            place,
            competitorId: ranked.competitorId,
            name: competitor.name,
            pointsSum,
            flashCount,
        })
        .from(ranked)
        .innerJoin(competitor, eq(ranked.competitorId, competitor.id))
        .where(lte(ranked.rowNumber, 20))
        .groupBy(ranked.competitorId, competitor.name)
        .orderBy(place, competitor.name);
}