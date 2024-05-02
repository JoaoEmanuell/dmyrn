import { PermissionsAndroid } from 'react-native'

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
        } else {
            console.log('Você não pode salvar os arquivos')
        }
    } catch (err) {
        console.warn(err)
    }
}
