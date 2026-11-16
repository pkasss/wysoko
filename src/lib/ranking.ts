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
    'adult-k': {category: 'adult', gender: 'k', label: 'ADULT W'},
    'kids-m': {category: 'kids', gender: 'm', label: 'KIDS M'},
    'kids-k': {category: 'kids', gender: 'k', label: 'KIDS W'}
}

export const LEVELS= [
    {name: 'GOD MODE', abovePercent: 80},
    {name: 'HELLRAISER', abovePercent: 50},
    {name: 'ROOKIE', abovePercent: -1}
] as const;

export function getLevel(beaten: number, total: number) {
    const percentage = (beaten / total) * 100;
    const level = LEVELS.find((l) => percentage > l.abovePercent);

    return level?.name ?? 'ROOKIE';
}

export type Level = typeof LEVELS[number]['name'];

export const levelStyle: Record<Level, string> = {
    'GOD MODE': 'bg-[#ff3d8f]',
    'HELLRAISER': 'bg-[#ffd6e7]',
    'ROOKIE': 'bg-white',
};

export const FINALISTS_PER_LEVEL: Record<Level, number> = {
    'GOD MODE': 8,
    'HELLRAISER': 4,
    'ROOKIE': 4
}