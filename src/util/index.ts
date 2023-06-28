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

// from https://stackoverflow.com/a/43382807
export function memoize<R, T extends (...args: any[]) => R>(f: T): T {
    const memory = new Map<string, R>();

    const g = (...args: any[]) => {
        if (!memory.get(args.join())) {
            memory.set(args.join(), f(...args));
        }

        return memory.get(args.join());
    };

    return g as T;
}
