export type videoFormats = '720' | '360' | '' // empty is mp3
export type ytdlObjectFormats = {
    itag: number // itag to extract the video in YouTube
    url: string // full url to video in YouTube
}
export type ytdlInfoType = {
    formats: ytdlObjectFormats[] // formats available for the video
    videoDetails: ytdlVideoDetails
}
export type ytdlVideoDetails = {
    title: string // title of the video
}
export type progressBarType = (progress: number, infinite: boolean) => void
export type outputType = (text: string) => void
