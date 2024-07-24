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

export class ytdlDownload implements ytdlDownloadInterface {
    videoUrl: string
    quality: 140 | 22 | 18
    saveFormat: 'm4a' | 'mp4'
    jobId: number
    progressBar: (progress: number, infinite: boolean) => void
    output: (text: string) => void
    contentType: 'video' | 'audio' | 'playlist'
    playlistVideos: string[]
    playlistExtractor: PlaylistExtractor
    downloadStop: boolean = false

    constructor(
        videoUrl: string,
        quality: 'mp3' | videoFormats,
        progressBar: (progress: number, infinite: boolean) => void,
        output: (text: string) => void,
        playlistExtractor: PlaylistExtractor
    ) {
        const qualityMap = {
            mp3: 140,
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
        this.playlistExtractor = playlistExtractor
        this.contentType = 'video'
        if (videoUrl.includes('?list=')) {
            this.contentType = 'playlist'
        }
    }

    async download() {
        if (this.contentType === 'playlist') {
            // download playlist
            await this.playlistDownload()
        } else {
            // one download
            await this.baseDownloader()
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
        this.output('Download cancelado')
    }

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
                this.output(`Download de ${title} iniciado`)
            },
            progress: (res) => {
                // Handle download progress updates if needed
                const progress = res.bytesWritten / res.contentLength
                this.progressBar(progress, false)
            },
        })
            .promise.then((response) => {
                console.log('File downloaded!', response)
                this.progressBar(-1, false)
            })
            .catch((err) => {
                if (err.toString().includes('aborted')) {
                    // aborted download
                } else {
                    console.log('Download error:', err)
                    this.output('Erro no download')
                }
            })
    }

    private baseDownloader = async () => {
        this.output('Coletando informações do vídeo!')
        this.progressBar(0, true)
        console.log(`Quality: ${this.quality}`)

        const videoExtract = await this.extractUrlToVideo()
        const title = videoExtract[0]
        const url = videoExtract[1]
        const fileTemporary = videoExtract[2]

        if (this.downloadStop) {
            // user stop download in extract step
            return true
        }

        this.output(`Iniciando download de: ${title}`)
        this.unlinkTemporaryFile(fileTemporary)

        await this.downloadContent(title, url, fileTemporary)

        if (this.downloadStop) {
            // user stop download
            return true
        }

        if (this.contentType === 'audio') {
            // convert to mp3
        }

        console.log('copy to external')

        await FileSystem.cpExternal(
            fileTemporary,
            `${secureFilename(title)}.${this.saveFormat}`,
            'downloads'
        )
        this.unlinkTemporaryFile(fileTemporary)

        this.output(`Download de ${title} finalizado!`)

        if (
            this.contentType === 'playlist' &&
            this.playlistVideos.length !== 0
        ) {
            this.nextPlaylistDownload()
        }

        return true
    }

    private filterFormat = (data: ytdlObjectFormats[]): ytdlObjectFormats => {
        let toReturn
        data.forEach((video) => {
            if (video.itag === this.quality) {
                toReturn = video
                return video
            }
        })
        return toReturn
    }

    private unlinkTemporaryFile = (fileTemporary) => {
        try {
            RNFS.unlink(fileTemporary)
        } catch (e) {
            console.log(e)
        }
    }

    private playlistDownload = async () => {
        this.output('Extraindo vídeos da playlist.')
        const videos = await this.playlistExtractor.getVideos(this.videoUrl)
        this.playlistVideos = videos

        this.output('Iniciando download da playlist.')
        await this.nextPlaylistDownload()
        if (!this.downloadStop) {
            this.output('Download da playlist concluído.')
        }
        return true
    }

    private nextPlaylistDownload = async () => {
        this.videoUrl = this.playlistVideos[0]
        await this.baseDownloader()
        this.playlistVideos.shift()
    }
}
