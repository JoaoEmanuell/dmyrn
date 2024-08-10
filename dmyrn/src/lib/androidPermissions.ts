import { PermissionsAndroid } from 'react-native'
import { logDir, RNFS } from './rnfs'
import { Logger } from '../utils/log'

/**
 * used to request the android permissions for the app works
 *
 * request the write external
 */
export const requestAndroidPermissions = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
                title: 'Permissão para salvar os arquivos',
                message:
                    'Por favor, conceda permissão para que o aplicativo possa salvar os arquivos!',
                buttonNeutral: 'Pergunte-me mais tarde',
                buttonNegative: 'Cancelar',
                buttonPositive: 'Ok',
            }
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Você pode salvar os arquivos')
            RNFS.mkdir(logDir) // create the log dir
        } else {
            console.log('Você não pode salvar os arquivos')
        }
    } catch (err) {
        Logger.error(`android request permission error: ${err}`)
        console.error(`android request permission error: ${err}`)
    }
}
