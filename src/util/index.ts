export function randomChoice<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}
