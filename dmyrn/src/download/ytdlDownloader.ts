import ytdl from '../externalLibs/react-native-ytdl'
import {
    videoFormats,
    ytdlInfoType,
    ytdlObjectFormats,
} from '../interfaces/types'
import { ytdlDownloadInterface } from '../interfaces/ytdlDownloaderInterface'
import { RNFS, cacheDir } from '../lib/rnfs'
import { secureFilename } from '../utils/secureFilename'
import { FileSystem } from 'react-native-file-access'
import { PlaylistExtractor } from './playlistExtractor'
import { Ffmpeg } from '../ffmpeg/ffmpeg'
import { unlinkFile } from '../utils/unlinkFile'
import { Logger } from '../utils/log'
import { Notification } from '../notification/notification'

export class ytdlDownload implements ytdlDownloadInterface {
    // public properties
    videoUrl: string
    quality: 140 | 22 | 18
    progressBar: (progress: number, infinite: boolean) => void
    output: (text: string) => void
    messageFinishedDownload: () => void
    playlistExtractor: PlaylistExtractor
    ffmpeg: Ffmpeg
    notification: Notification

    // private properties

    private saveFormat: 'm4a' | 'mp4' | 'mp3' // m4a is used to save the 360p in audio format to use ffmpeg for convert to mp3
    private jobId: number // used to RNFS to stop download
    private contentType: 'video' | 'audio'
    private playlistVideos: string[] // string array withe the videos of the playlist
    private downloadStop: boolean = false // if true, the user clicked in stop download button
    private isPlaylist: boolean = false // if true, the url is a playlist

    constructor(
        videoUrl: string,
        quality: 'mp3' | videoFormats,
        progressBar: (progress: number, infinite: boolean) => void,
        output: (text: string) => void,
        messageFinishedDownload: () => void,
        playlistExtractor: PlaylistExtractor,
        ffmpeg: Ffmpeg,
        notification: Notification
    ) {
        const qualityMap = {
            mp3: 18, // yes, the download of the mp3 is in 360p to accelerate
            '720': 22,
            '360': 18,
        }
        const saveFormatMap = {
            mp3: 'm4a',
            '720': 'mp4',
            '360': 'mp4',
        }
        this.videoUrl = videoUrl
        this.quality = qualityMap[quality]
        this.saveFormat = saveFormatMap[quality]
        this.progressBar = progressBar
        this.output = output
        this.messageFinishedDownload = messageFinishedDownload
        this.playlistExtractor = playlistExtractor
        this.ffmpeg = ffmpeg
        this.notification = notification
        this.contentType = 'video'
        if (this.saveFormat === 'm4a') {
            this.contentType = 'audio'
        }
        if (videoUrl.includes('?list=')) {
            this.isPlaylist = true
        }
    }

    async download() {
        if (this.isPlaylist) {
            // download playlist
            await this.playlistDownload()
        } else {
            // one download
            await this.baseDownloader()
            this.messageFinishedDownload()
        }
        return true
    }

    async cancel() {
        this.output('Iniciando o cancelamento do download')
        this.downloadStop = true
        this.playlistVideos = []
        if (this.jobId !== undefined) {
            await RNFS.stopDownload(this.jobId)
        }
        await this.ffmpeg.stop()
        this.progressBar(-1, false)
        this.output('Download cancelado')
    }

    /**
     * extract the url to video, case the format is not available return a empty, and cancel the execution
     * @returns [title, url, filename with path to temporary file (saved in cache dir)]
     */
    private extractUrlToVideo = async () => {
        const id = await ytdl.getVideoID(this.videoUrl)
        const info = (await ytdl.getInfo(id, {})) as ytdlInfoType
        const format = this.filterFormat(info.formats)

        if (format === undefined) {
            this.output(
                'Erro no download, formato não disponível para download, selecione outro formato e tente novamente!'
            )
            this.progressBar(-1, false)
            return
        }

        const url = `${format.url}`
        const title = info.videoDetails.title
        const fileTemporary = `${cacheDir}/${secureFilename(title)}.${
            this.saveFormat
        }`

        return [title, url, fileTemporary]
    }

    /**
     * used to manage the RNFS download file, download the video in YouTube
     * @param title title of the video
     * @param url url of the video
     * @param fileTemporary temporary file to video
     */
    private downloadContent = async (
        title: string,
        url: string,
        fileTemporary: string
    ) => {
        await RNFS.downloadFile({
            fromUrl: url,
            toFile: fileTemporary,
            background: true,
            begin: (res) => {
                this.jobId = res.jobId
                this.output(`Download de: \n${title}\n iniciado`)
            },
            progress: (res) => {
                // Handle download progress updates if needed
                const progress = res.bytesWritten / res.contentLength
                this.progressBar(progress, false)
            },
        })
            .promise.then((response) => {
                Logger.debug('File downloaded!', response)
                this.progressBar(-1, false)
            })
            .catch((err) => {
                if (err.toString().includes('aborted')) {
                    // aborted download
                } else {
                    Logger.error('Download error: ', err)
                    this.output('Erro no download')
                    throw 'Error to download the content'
                }
            })
    }

    /**
     * base downloader is called to manager the download, this method call the extractor, download content, conversion for mp3, next playlist video download (if the last video download, call the message for finished download)
     * @returns promise with true
     */
    private baseDownloader = async () => {
        this.output('Coletando informações do vídeo!')
        this.progressBar(0, true)
        Logger.debug(`Quality: ${this.quality}`)

        const videoExtract = await this.extractUrlToVideo()
        const title = videoExtract[0]
        const url = videoExtract[1]
        let fileTemporary = videoExtract[2]

        if (this.downloadStop) {
            // user stop download in extract step
            return true
        }

        this.output(`Iniciando download de: \n${title}`)
        this.notification.sendNotification(
            'Baixador YouTube',
            'Iniciando o download'
        )
        unlinkFile(fileTemporary)

        try {
            await this.downloadContent(title, url, fileTemporary)
        } catch (err) {
            // error in download
            Logger.error(`Error to download ${err}`)
            this.progressBar(-1, false)
            this.output('Erro no download!')
            return false
        }

        if (this.downloadStop) {
            // user stop download
            return true
        }

        let formatToSaveFileInDownloads = this.saveFormat

        if (this.contentType === 'audio') {
            // convert to mp3
            this.output('Convertendo para mp3')
            fileTemporary = await this.ffmpeg.convertM4aToMp3(
                fileTemporary,
                this.progressBar
            )

            Logger.debug(`end conversion ${fileTemporary}`)
            formatToSaveFileInDownloads = 'mp3'

            this.output('Conversão concluída')
        }

        Logger.debug('copy to external')

        await FileSystem.cpExternal(
            fileTemporary,
            `${secureFilename(title)}.${formatToSaveFileInDownloads}`,
            'downloads'
        )
        unlinkFile(fileTemporary)

        this.output(`Download de: \n${title}\n finalizado!`)
        this.progressBar(-1, false)
        await this.notification.sendNotification(
            'Baixador YouTube',
            `Download de '${title}' finalizado!`
        )

        if (this.isPlaylist && this.playlistVideos.length !== 0) {
            // next playlist download
            this.nextPlaylistDownload()
        } else if (this.isPlaylist && this.playlistVideos.length === 0) {
            // message of the end playlist
            this.output('Download da playlist concluído.')
            this.messageFinishedDownload()
        }

        return true
    }

    /**
     * used to get the one object of the ytdl
     * @param data array with all ytdl objects
     * @returns one ytdl object
     */

    private filterFormat = (data: ytdlObjectFormats[]): ytdlObjectFormats => {
        let toReturn
        console.log(`formats`)

        data.forEach((video) => {
            console.log(video.itag)

            if (video.itag === this.quality) {
                toReturn = video
                return video
            }
        })
        return toReturn
    }

    /**
     * extract the playlist videos, and set the playlist videos with extracted videos, start the playlist download
     * @returns promise with boolean
     */

    private playlistDownload = async () => {
        this.output('Extraindo vídeos da playlist.')
        const videos = await this.playlistExtractor.getVideos(this.videoUrl)
        this.playlistVideos = videos

        this.output('Iniciando download da playlist.')
        await this.nextPlaylistDownload()
        return true
    }

    /**
     * get the video url in playlist videos and download the video
     */
    private nextPlaylistDownload = async () => {
        this.videoUrl = this.playlistVideos[0]
        this.playlistVideos.shift()
        await this.baseDownloader()
    }
}
