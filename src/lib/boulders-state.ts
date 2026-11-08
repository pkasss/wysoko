import type {getBouldersWithResults} from "@/src/db/queries/boulders";

export type Boulders = Awaited<ReturnType<typeof getBouldersWithResults>>;
export type Boulder = Boulders[number];

export const BOULDER_STATUSES = ['none', 'zone', 'top', 'flash'] as const;
export type BoulderStatus = typeof BOULDER_STATUSES[number];

export type SaveResultCode = 'invalid' | 'unauthorized' | 'not_found' | 'not_competitor' | 'not_started' | 'closed';
export type SaveResultResponse = | {ok: true} | {ok: false, reason: SaveResultCode};
export const saveResultResponseMessage: Record<SaveResultCode, string> = {
    invalid: 'coś poszło nie tak.',
    unauthorized: 'zaloguj się ponownie.',
    not_found: 'coś poszło nie tak.',
    not_competitor: 'nie startujesz w tych zawodach.',
    not_started: 'grupa jeszcze nie wystartowała.',
    closed: 'minęło 20 minut od końca grupy.'
}

export const statusFlags: Record<BoulderStatus, {isZone: boolean, isTop: boolean, isFlash: boolean}> = {
    'none': {isZone: false, isTop: false, isFlash: false},
    'zone': {isZone: true, isTop: false, isFlash: false},
    'top': {isZone: true, isTop: true, isFlash: false},
    'flash': {isZone: true, isTop: true, isFlash: true}
}

export function getBoulderStatus(boulder: Boulder): BoulderStatus {
    if (boulder.isFlash) return 'flash';
    if (boulder.isTop) return 'top';
    if (boulder.isZone) return 'zone';
    return 'none';
}

export function isBoulderStatus(value: string): value is BoulderStatus {
    return (BOULDER_STATUSES as readonly string[]).includes(value);
}

export function getNextStatus(status: BoulderStatus): BoulderStatus {
    const index = BOULDER_STATUSES.indexOf(status);

    return BOULDER_STATUSES[(index + 1) % BOULDER_STATUSES.length];
}