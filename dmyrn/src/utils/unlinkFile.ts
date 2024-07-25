import { RNFS } from '../lib/rnfs'

export const unlinkFile = (file: string) => {
    try {
        RNFS.unlink(file)
    } catch (e) {
        console.log(e)
    }
}
