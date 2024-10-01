export type videoFormats = '720' | '360' | '' // empty is mp3
export type ytdlObjectFormats = {
    itag: number // itag to extract the video in YouTube
    url: string // full url to video in YouTube
    mimeType: string
    qualityLabel: string | null
    bitrate: string
    audioBitrate: string
    quality: string
    hasVideo: boolean
    hasAudio: boolean
    container: string
    //{"width":640,"height":358,"lastModified":"1724888529726016","contentLength":"16697087","quality":"medium","fps":30,"projectionType":"RECTANGULAR","averageBitrate":452467,"audioQuality":"AUDIO_QUALITY_LOW","approxDurationMs":"295218","audioSampleRate":"44100","audioChannels":2,"hasVideo":true,"hasAudio":true,"container":"mp4","codecs":"avc1.42001E, mp4a.40.2","videoCodec":"avc1.42001E","audioCodec":"mp4a.40.2","isLive":false,"isHLS":false,"isDashMPD":false}
}
export type ytdlInfoType = {
    formats: ytdlObjectFormats[] // formats available for the video
    videoDetails: ytdlVideoDetails
}
export type ytdlVideoDetails = {
    title: string // title of the video
    author: {
        id: string
        name: string
    }
}
export type progressBarType = (progress: number, infinite: boolean) => void
export type outputType = (text: string) => void
// https://github.com/dimaportenko/react-native-receive-share-file-tutorial/blob/main/src/useGetShare.tsx
export type fileIntent = {
    filePath?: string
    text?: string
    weblink?: string
    mimeType?: string
    contentUri?: string
    fileName?: string
    extension?: string
}
