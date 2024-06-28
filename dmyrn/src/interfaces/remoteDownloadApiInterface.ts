import { Dispatch, SetStateAction } from 'react'
import { videoFormats } from './types'

export interface remoteDownloadApiInterface {
    url: string
    format: 'mp3' | 'mp4'
    videoFormats: videoFormats
    typeOfContent: 'video' | 'playlist'
    download: () => Promise<boolean> // true in end, false if error
    setOutputText: Dispatch<SetStateAction<string>> // used to send messages to interface
    progressBarManager: (percent?: number, infinite?: boolean) => void // used to manage the progress bar
}
