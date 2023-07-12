const DISMISSED_SPLASH = 'dismissed splash?'

const getBool = (key: string): boolean | undefined => {
    const value = localStorage.getItem(key)
    if (value === null) return undefined
    return (value === 'true')
}

const setBool = (key: string, value: boolean) => {
    localStorage.setItem(key, value ? 'true' : 'false')
}

export const hasDismissedSplash = () =>
    getBool(DISMISSED_SPLASH)

export const setDismissedSplash = (hasDismissedSplash: boolean) =>
    setBool(DISMISSED_SPLASH, hasDismissedSplash)
