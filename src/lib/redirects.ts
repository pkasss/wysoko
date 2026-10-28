export function getSafeRedirect(next?: string) {
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}