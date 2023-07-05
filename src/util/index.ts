import stringify from 'fast-json-stable-stringify'

/**
 * N.B. returns undefined when the random array is empty.
 */
export function randomChoice<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function createMakeChoice<T>(domain: Array<T>) {
    type Values = typeof domain[number];
    const makeChoice = (...blockedChoices: Array<Values | undefined>) => {
        if (domain.length === 1) return domain[0]
        let nextChoice: Values | undefined = blockedChoices[0]
        while (nextChoice === undefined || blockedChoices.includes(nextChoice)) {
            nextChoice = randomChoice(domain) as Values
        }
        if (nextChoice === undefined) throw new Error("makeChoice wasn't able to find a choice")
        return nextChoice
    }
    return makeChoice
}

// from https://stackoverflow.com/a/43382807 then modified to use stringify
export function memoize<R, T extends (...args: any[]) => R>(f: T): T {
    const memory = new Map<string, R>();
    const g = (...args: any[]) => {
        const paramRepr = stringify(args)
        if (!memory.get(paramRepr)) {
            memory.set(paramRepr, f(...args));
        }
        return memory.get(paramRepr);
    };
    return g as T;
}

/**
 * Return 0 <= i <= array.length such that !pred(array[i - 1]) && pred(array[i]).
 * This and lowerBound / upperBound from https://stackoverflow.com/a/41956372
 */
export function binarySearch<T>(array: Array<T>, pred: (item: T) => boolean) {
    let lo = -1, hi = array.length;
    while (1 + lo < hi) {
        const mi = lo + ((hi - lo) >> 1);
        if (pred(array[mi])) {
            hi = mi;
        } else {
            lo = mi;
        }
    }
    return hi;
}
/**
 * Return i such that array[i - 1] < item <= array[i].
 */
export function lowerBound<T>(array: Array<T>, item: T) {
    return binarySearch(array, j => item <= j);
}

/**
 * Return i such that array[i - 1] <= item < array[i].
 */
export function upperBound<T>(array: Array<T>, item: T) {
    return binarySearch(array, j => item < j);
}

/**
 * Return a modified version of the given array with the element
 * at a given index replaced with a replacement element.
 */
export const withReplacement = <T,>(array: Array<T>, index: number, replacement: T) =>
  [...array.slice(0, index), replacement, ...array.slice(index + 1)]

// memoized so we don't thrash renders / recompute useCallbacks in <Choice />

/**
 * Returns the first N integers, e.g. firstNDigits(5) === [0, 1, 2, 3, 4].
 */
export const firstNDigits = memoize((n: number) => [...Array(n).keys()])
