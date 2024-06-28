export type videoFormats = '720' | '360' | ''
export type videoContentRemoteApiReturn = {
    headers: object
    url: string
    title: string
}
export type mp3ApiStatusType = {
    status: boolean
    current: number | undefined
    filename: string | undefined
    total: number | undefined
}
export type mp3ApiConverteds = {
    audio: string
    filename: string
}
