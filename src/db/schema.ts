import {pgTable, integer, text, date, boolean, varchar, unique} from 'drizzle-orm/pg-core';
import {user} from './auth-schema';

export const competition = pgTable('competition', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull(),
    date: date().notNull(),
    zoneMultiplier: integer().notNull(),
    topMultiplier: integer().notNull()
});

export const competitor = pgTable('competitor',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        token: varchar().unique().notNull(),
        userId: text('user_id')
            .references(() => user.id)
            .notNull(),
        competitionId: integer('competition_id')
            .references(() => competition.id)
            .notNull()
    }, (table) => [
        unique().on(table.userId, table.competitionId)
    ]
);

export const boulder = pgTable('boulder',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        number: integer().notNull(),
        grade: integer().notNull(),
        competitionId: integer('competition_id')
            .references(() => competition.id)
            .notNull()
    },
    (table) => [
        unique().on(table.number, table.competitionId)
    ]
);

export const result = pgTable('result',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        competitorId: integer('competitor_id')
            .references(() => competitor.id)
            .notNull(),
        boulderId: integer('boulder_id')
            .references(() => boulder.id)
            .notNull(),
        isZone: boolean().default(false).notNull(),
        isTop: boolean().default(false).notNull(),
    }, (table) => [
        unique().on(table.competitorId, table.boulderId)
    ]
);