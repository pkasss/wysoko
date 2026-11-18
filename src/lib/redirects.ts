const BASE_URL = 'https://app.myavatar.pl';

export function getSafeRedirect(next?: string) {
    if (!next) {
        return '/';
    }

    try {
        const url = new URL(next, BASE_URL);
        if (url.origin !== BASE_URL) {
            return '/';
        }

        return url.pathname + url.search + url.hash;
    } catch {
        return '/';
    }

}