/* eslint-disable @typescript-eslint/no-shadow */
import axios, { Axios, AxiosResponse } from 'axios'
import { remoteDownloadApiInterface } from '../../interfaces/remoteDownloadApiInterface'
import {
    videoContentRemoteApiReturn,
    videoFormats,
} from '../../interfaces/types'
import { Dispatch, SetStateAction } from 'react'
import { RNFS, savePath } from '../../lib/rnfs'
import { secureFilename } from '../../utils/secureFilename'
import { Mp3Api } from '../mp3Api/mp3Api'

export class RemoteDownloadApi implements remoteDownloadApiInterface {
    url: string
    format: 'mp3' | 'mp4'
    videoFormats: videoFormats
    typeOfContent: 'video' | 'playlist'
    mp3Api: Mp3Api
    setOutputText: Dispatch<SetStateAction<string>>
    progressBarManager: (percent?: number, infinite?: boolean) => void
    private jobId: number
    private playlistVideos: string[]
    private playlistDownload: boolean
    private retry: number

    private axiosConfig: Axios

    constructor(
        url: string,
        formats: 'mp3' | 'mp4',
        videoFormats: videoFormats,
        typeOfContent: 'video' | 'playlist',
        mp3Api: Mp3Api,
        setOutputText: Dispatch<SetStateAction<string>>,
        progressBarManager: (percent?: number, infinite?: boolean) => void
    ) {
        // variables
        this.url = url
        this.format = formats
        this.videoFormats = videoFormats
        this.typeOfContent = typeOfContent
        this.setOutputText = setOutputText
        this.progressBarManager = progressBarManager
        this.playlistVideos = []
        this.playlistDownload = false
        this.retry = 0
        this.mp3Api = mp3Api

        this.axiosConfig = axios.create({
            baseURL: 'http://192.168.0.110:8080/api', //'https://ytdlpapi-8be5em2b.b4a.run/api',
            timeout: 20000, // 20 seconds
        })
    }

    async download() {
        console.log('start download')

        if (this.typeOfContent === 'video') {
            if (this.format === 'mp3') {
                await this.downloadAudio()
                return true
            } else {
                await this.downloadVideo()
                return true
            }
        } else {
            this.downloadPlaylist()
        }
    }

    stopDownload(): boolean {
        if (this.jobId === undefined) {
            return false
        } else {
            RNFS.stopDownload(this.jobId)
            this.jobId = undefined
            return true
        }
    }

    private async downloadPlaylist() {
        this.setOutputText('Coletando informações da playlist!')
        this.progressBarManager(0, true)
        const playlistInfo = await this.axiosConfig.post('/playlist/', {
            url: this.url,
        })
        const data: string[] = playlistInfo.data
        console.log(playlistInfo)

        this.playlistVideos = data
        this.playlistDownload = true
        this.typeOfContent = 'video'
        this.downloadNextVideo()
    }

    private async downloadAudio() {
        this.setOutputText('Coletando informações da música!')
        this.progressBarManager(0, true)
        let videoInfo: AxiosResponse<any, any>
        try {
            videoInfo = await this.axiosConfig.post('/video/', {
                url: this.url,
                quality: this.format,
            })
        } catch (err) {
            if (this.retry <= 5) {
                console.log(`Retry: ${this.retry}`)
                this.retry++
                this.downloadAudio()
            } else {
                this.setOutputText('Erro no download')
                this.stopDownload()
                this.progressBarManager(1)
            }
        }
        const data = videoInfo.data as videoContentRemoteApiReturn
        if (data['headers'] === null) {
            // error in download
            this.downloadAudio()
            return
        } else if (this.jobId === undefined) {
            this.setOutputText(
                `Download da música \n"${data.title}"\n iniciado!`
            )
            await this.downloadFile(data)
        }
    }

    private async downloadVideo() {
        this.setOutputText('Coletando informações do vídeo!')
        this.progressBarManager(0, true)
        const videoInfo = await this.axiosConfig.post('/video', {
            url: this.url,
            quality: this.videoFormats,
        })
        const data = videoInfo.data as videoContentRemoteApiReturn
        if (data['headers'] === null) {
            // error in download
            this.downloadVideo()
            return
        } else if (this.jobId === undefined) {
            this.setOutputText(
                `Download do vídeo \n"${data.title}"\n iniciado!`
            )
            this.downloadFile(data)
        }
    }

    private async downloadFile(data: videoContentRemoteApiReturn) {
        const fileWithPath =
            '/storage/emulated/0/Download/oh_profundidade__live_.mp3'
        const convertResult = await this.mp3Api.start(fileWithPath)
        console.log(convertResult)
        /*const fileWithPath = `${savePath}/${secureFilename(data.title)}.${
            this.format
        }`

        try {
            RNFS.unlink(fileWithPath).then(() => {
                console.log('Previous file deleted')
            })
        } catch (err) {
            console.log('file not exists')
        }

        await RNFS.downloadFile({
            fromUrl: data.url,
            toFile: fileWithPath,
            headers: data.headers,
            progress: (res) => {
                const progress = res.bytesWritten / res.contentLength
                this.progressBarManager(progress, false)
                this.setOutputText(`Progress: ${(progress * 100).toFixed(2)}%`)
            },
            begin: (res) => {
                this.jobId = res.jobId
            },
        })
            .promise.then(async (response) => {
                console.log('File downloaded!', response)
                if (response['statusCode'] !== 403) {
                    this.setOutputText('Download concluído')
                    this.jobId = undefined
                    const convertResult = await this.mp3Api.start(fileWithPath)
                    console.log(convertResult)
                    this.downloadNextVideo()
                } else {
                    this.download()
                    this.retry = 0
                }
            })
            .catch((err) => {
                if (!err.toString().includes('aborted')) {
                    console.log('Download error:')
                    console.log(err)
                    this.setOutputText('Erro no download!')
                    this.progressBarManager(1)
                }
            })*/
    }

    private downloadNextVideo = () => {
        if (this.playlistVideos.length !== 0) {
            console.log(this.playlistVideos)
            this.url = this.playlistVideos[0]
            this.playlistVideos.shift()
            this.download()
        } else if (this.playlistDownload) {
            this.setOutputText('Download da playlist concluído!')
        }
    }
}
