import {pgTable, integer, text, date, boolean, unique, pgEnum, timestamp} from 'drizzle-orm/pg-core';
import {user} from "@/src/db/auth-schema";

export const categoryType = pgEnum('category_type', ['adult', 'kids']);
export const genderType = pgEnum('sex_type', ['k', 'm']);
export const heatType = pgEnum('heat_type', ['qualification', 'harvestFest']);

export type Category = (typeof categoryType.enumValues)[number];
export type Gender = (typeof genderType.enumValues)[number];

export const competition = pgTable('competition', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    slug: text().notNull(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    zoneMultiplier: integer().notNull(),
    topMultiplier: integer().notNull()
});

export const competitor = pgTable('competitor',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        userId: text()
            .references(() => user.id, {onDelete: "set null"}),
        externalId: text().notNull(),
        email: text().notNull(),
        name: text().notNull(),
        gender: genderType().notNull(),
        category: categoryType().notNull(),
        birthDate: date().notNull(),
        heatId: integer()
            .references(() => heat.id)
            .notNull(),
        competitionId: integer('competition_id')
            .references(() => competition.id)
            .notNull()
    }, (table) => [
        unique().on(table.externalId, table.competitionId)
    ]
);

export const heat = pgTable('heat',
    {
        id: integer().primaryKey().generatedAlwaysAsIdentity(),
        number: integer(),
        type: heatType().notNull(),
        competitionId: integer('competition_id')
            .references(() => competition.id)
            .notNull(),
        startTime: timestamp({withTimezone: true}).notNull(),
        endTime: timestamp({withTimezone: true}).notNull(),
    }, (table) => [
        unique().on(table.number, table.competitionId)
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
            .references(() => competitor.id, {onDelete: "cascade"})
            .notNull(),
        boulderId: integer('boulder_id')
            .references(() => boulder.id)
            .notNull(),
        isZone: boolean().default(false).notNull(),
        isTop: boolean().default(false).notNull(),
        isFlash: boolean().default(false).notNull(),
        updatedAt: timestamp({withTimezone: true}).defaultNow().notNull(),
    }, (table) => [
        unique().on(table.competitorId, table.boulderId)
    ]
);