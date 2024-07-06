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

export class ytdlDownload implements ytdlDownloadInterface {
    videoUrl: string
    quality: 140 | 22 | 18
    saveFormat: 'm4a' | 'mp4'
    jobId: number
    progressBar: (progress: number, infinite: boolean) => void
    output: (text: string) => void

    constructor(
        videoUrl: string,
        quality: 'mp3' | videoFormats,
        progressBar: (progress: number, infinite: boolean) => void,
        output: (text: string) => void
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
    }

    async download() {
        this.output('Coletando informações do vídeo!')
        this.progressBar(0, true)
        console.log(`Quality: ${this.quality}`)

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
        console.log(url)
        const fileTemporary = `${cacheDir}/${secureFilename(title)}.${
            this.saveFormat
        }`

        this.output(`Iniciando download de: ${title}`)
        this.unlinkTemporaryFile(fileTemporary)

        await RNFS.downloadFile({
            fromUrl: url,
            toFile: fileTemporary,
            background: true,
            begin: (res) => {
                this.jobId = res.jobId
                this.output('Download iniciado')
            },
            progress: (res) => {
                // Handle download progress updates if needed
                const progress = res.bytesWritten / res.contentLength
                this.progressBar(progress, false)
            },
        })
            .promise.then((response) => {
                console.log('File downloaded!', response)
                this.output('Download finalizado')
                this.progressBar(-1, false)
            })
            .catch((err) => {
                console.log('Download error:', err)
                this.output('Erro no download')
            })
        console.log('copy to external')

        await FileSystem.cpExternal(
            fileTemporary,
            `${secureFilename(title)}.${this.saveFormat}`,
            'downloads'
        )
        this.unlinkTemporaryFile(fileTemporary)
    }
    async cancel() {
        this.output('Iniciando o cancelamento do download')
        await RNFS.stopDownload(this.jobId)
        this.output('Download cancelado')
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
}
