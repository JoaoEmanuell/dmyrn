export const getRandomElementKey = () => {
    const date = new Date()
    const time = date.getTime()
    const key = time * Math.random()
    return key.toString()
}
