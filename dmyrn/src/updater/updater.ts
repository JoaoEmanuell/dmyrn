import { Linking } from 'react-native'
import AlertAsync from 'react-native-alert-async'

import { UpdaterInterface } from '../interfaces/updaterInterface'
import { version } from './version'
import { Logger } from '../utils/log'

const onlineRepositoryUrl =
    'https://raw.githubusercontent.com/JoaoEmanuell/dmyrn/feature-updater' // change to master when finished the first app version

const headers = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
}

const webSiteUrl = ''

export class Updater implements UpdaterInterface {
    async verifyIfHasAnUpdate() {
        const response = await fetch(
            `${onlineRepositoryUrl}/dmyrn/src/updater/version.ts`,
            headers as RequestInit
        )
        const text = (await response.text()).trim()
        if (text !== `export const version = '${version}'`) {
            const choice = await AlertAsync(
                'Atualização',
                `Uma nova versão do aplicativo foi encontrada, ao clicar em OK você será redirecionado para o navegador para poder baixar a nova versão!\nCaso isso não aconteça, acesse ${webSiteUrl}/download para poder baixar a nova versão!`,
                [{ text: 'OK', onPress: () => 'ok' }]
            ) // show the alert and await the user confirmation
            if (choice === 'ok') {
                try {
                    await Linking.openURL(webSiteUrl) // open the browser
                } catch (err) {
                    alert(
                        `Não foi possível abrir o navegador, acesse ${webSiteUrl}/download para poder baixar a nova versão!`
                    )
                    Logger.error(`Updater linking ${err}`)
                }
            }
        }
        return true
    }
}
