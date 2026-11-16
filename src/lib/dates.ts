export function getToday() {
    return new Date().toLocaleDateString(
        'en-CA',
        {timeZone: 'Europe/Warsaw'}
    );
}

export const formatTime = (date: Date) =>
    date.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw'});

export const formatDate = (date: Date) =>
    date.toLocaleDateString('pl-PL',
        {weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw'}
    );

export function formatDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}