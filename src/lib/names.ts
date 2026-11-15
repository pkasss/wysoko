export function normalizeName(name: string): string {
    if (name !== name.toLocaleUpperCase('pl') && name !== name.toLocaleLowerCase('pl')) {
        return name;
    }

    return name
        .toLocaleLowerCase('pl')
        .replace(/(^|[\s\-'])(\p{L})/gu, (match) => match.toLocaleUpperCase('pl'));
}

export function getFirstName(name: string):string {
    return name.split(' ')[0];
}