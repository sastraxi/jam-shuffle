export function randomChoice<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function createMakeChoice<T>(domain: Array<T>) {
    type Values = typeof domain[number];
    const makeChoice = (lastChoice: Values | undefined = undefined) => {
        if (domain.length === 1) return domain[0]
        let nextChoice: Values | undefined = lastChoice
        while (nextChoice === lastChoice) {
            nextChoice = randomChoice(domain) as Values
        }
        return nextChoice
    }
    return makeChoice
}
