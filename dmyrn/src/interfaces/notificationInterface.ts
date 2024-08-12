export interface NotificationInterface {
    /**
     * Send a notification to user
     * @param title title of notification
     * @param body notification body
     * @returns boolean
     */
    sendNotification: (title: string, body: string) => Promise<boolean>
    /**
     * Send a progress notification
     * @param current progress current, if -1 then notification is removed
     * @returns void
     */
    progressNotification: (current: number) => void
}
