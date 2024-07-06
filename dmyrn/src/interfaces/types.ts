export type videoFormats = '720' | '360' | ''
export type videoContentRemoteApiReturn = {
    headers: object
    url: string
    title: string
}
export type ytdlObjectFormats = {
    itag: number
    url: string
}
export type ytdlInfoType = {
    formats: ytdlObjectFormats[]
    videoDetails: ytdlVideoDetails
}
export type ytdlVideoDetails = {
    title: string
}
