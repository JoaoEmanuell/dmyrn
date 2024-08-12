import { NotificationInterface } from '../interfaces/notificationInterface'
import notifee, { AndroidImportance } from '@notifee/react-native'

export class Notification implements NotificationInterface {
    private defaultChannelId: string | undefined
    private progressChannelId: string | undefined
    private progressId = '136'

    private async getChannelId(channel: 'default' | 'progress') {
        switch (channel) {
            case 'default':
                return await this.getDefaultChannelId()
            case 'progress':
                return await this.getProgressChannelId()
        }
    }

    private async getDefaultChannelId() {
        if (!this.defaultChannelId) {
            const channelId = await notifee.createChannel({
                id: 'default',
                name: 'Padrão',
                vibration: true,
                importance: AndroidImportance.DEFAULT,
            })
            this.defaultChannelId = channelId
            return channelId
        } else {
            return this.defaultChannelId
        }
    }

    private async getProgressChannelId() {
        if (!this.progressChannelId) {
            const channelId = await notifee.createChannel({
                id: 'progress',
                name: 'Progresso',
                vibration: false,
                importance: AndroidImportance.DEFAULT,
            })
            this.progressChannelId = channelId
            return channelId
        } else {
            return this.progressChannelId
        }
    }

    async sendNotification(title: string, body: string) {
        const channelId = await this.getChannelId('default')
        await notifee.displayNotification({
            title: title,
            body: body,
            android: {
                channelId,
                pressAction: {
                    id: 'default',
                },
            },
        })
        return true
    }

    async progressNotification(current: number) {
        // Logger.debug(`progress notification: ${current}`)
        if (current === -1) {
            notifee.cancelDisplayedNotification(this.progressId)
            return
        }
        const channelId = await this.getChannelId('progress')
        await notifee.displayNotification({
            id: this.progressId,
            android: {
                channelId,
                progress: { max: 100, current: current * 100 },
                ongoing: true,
            },
        })
    }
}
