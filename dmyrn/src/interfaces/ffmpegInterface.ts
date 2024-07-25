import { progressBarType } from './types'

export interface FfmpegInterface {
    /**
     * Init the ffmpeg
     */
    initFfmpeg(): Promise<boolean>
    /**
     * Convert the m4a / mp4 file to mp3 file
     * @param filename filename with path to m4a file
     * @param progressBar progress bar, used to show the progress in interface
     */
    convertM4aToMp3(
        filename: string,
        progressBar: progressBarType
    ): Promise<String>
    /**
     * Stop all ffmpeg conversions
     */
    stop()
}
