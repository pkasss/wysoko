import type {Category, Gender} from "@/src/db/schema";

export const LEADERBOARD_TYPES = ['adult-m', 'adult-k', 'kids-m', 'kids-k'] as const;
export type LeaderboardType = typeof LEADERBOARD_TYPES[number];

export const DEFAULT_LEADERBOARD: LeaderboardType = 'adult-m';

export function isLeaderboardType(value: string): value is LeaderboardType {
    return(LEADERBOARD_TYPES as readonly string[]).includes(value)
}

export type Leaderboard = {
    category: Category;
    gender: Gender;
    label: string;
}

export const LEADERBOARDS: Record<LeaderboardType, Leaderboard> = {
    'adult-m': {category: 'adult', gender: 'm', label: 'ADULT M'},
    'adult-k': {category: 'adult', gender: 'k', label: 'ADULT K'},
    'kids-m': {category: 'kids', gender: 'm', label: 'KIDS M'},
    'kids-k': {category: 'kids', gender: 'k', label: 'KIDS K'}
}