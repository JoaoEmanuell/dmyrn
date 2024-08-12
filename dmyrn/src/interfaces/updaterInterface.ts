export interface UpdaterInterface {
    verifyIfHasAnUpdate: () => Promise<boolean>
}
