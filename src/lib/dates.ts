export function getToday() {
    return new Date().toLocaleDateString(
        'en-CA',
        {timeZone: 'Europe/Warsaw'}
    );
}

export const formatTime = (date: Date) =>
    date.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw'});