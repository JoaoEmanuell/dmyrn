/**
 * generate a random string, used as element key
 * @returns string formed with `time * random number`
 */
export const getRandomElementKey = () => {
    const date = new Date()
    const time = date.getTime()
    const key = time * Math.random()
    return key.toString()
}
