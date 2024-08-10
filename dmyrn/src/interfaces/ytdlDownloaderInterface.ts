import { PlaylistExtractor } from '../download/playlistExtractor'
import { Ffmpeg } from '../ffmpeg/ffmpeg'
import { outputType, progressBarType } from './types'
import { Notification } from '../notification/notification'

export interface ytdlDownloadInterface {
    videoUrl: string
    quality: 140 | 22 | 18
    playlistExtractor: PlaylistExtractor
    ffmpeg: Ffmpeg
    notification: Notification
    progressBar: progressBarType
    output: outputType
    messageFinishedDownload(): void
    /**
     * download the content
     * @returns promise with a boolean on end the execution
     */
    download: () => Promise<Boolean>
    /**
     * cancel the download, and conversion.
     * @returns void
     */
    cancel: () => {}
}
