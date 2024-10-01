import { PlaylistExtractor } from '../download/playlistExtractor'
import { Ffmpeg } from '../ffmpeg/ffmpeg'
import { outputType, progressBarType, ytdlObjectFormats } from './types'
import { Notification } from '../notification/notification'

export interface ytdlDownloadInterface {
    videoUrl: string
    playlistExtractor: PlaylistExtractor
    ffmpeg: Ffmpeg
    notification: Notification
    progressBar: progressBarType
    output: outputType
    messageFinishedDownload(): void
    /**
     * download the content
     * @param itag itag for video
     * @returns promise with a boolean on end the execution
     */
    download: (format: 'audio' | 'video') => Promise<Boolean>
    /**
     * cancel the download, and conversion.
     * @returns void
     */
    cancel: () => {}
    getInfo(): Promise<Array<string | ytdlObjectFormats[]>>
}
