/* eslint-disable @typescript-eslint/no-shadow */
import axios, { Axios } from 'axios'
import { remoteDownloadApiInterface } from '../../interfaces/remoteDownloadApiInterface'
import {
    videoContentRemoteApiReturn,
    videoFormats,
} from '../../interfaces/types'
import { Dispatch, SetStateAction } from 'react'
import { RNFS, savePath } from '../../lib/rnfs'

export class RemoteDownloadApi implements remoteDownloadApiInterface {
    url: string
    format: 'mp3' | 'mp4'
    videoFormats: videoFormats
    setOutputText: Dispatch<SetStateAction<string>>
    typeOfContent: 'video' | 'playlist'
    progressBarManager: (percent?: number, infinite?: boolean) => void
    private jobId: number
    private playlistVideos: string[]
    private playlistDownload: boolean

    axiosConfig: Axios

    constructor(
        url: string,
        formats: 'mp3' | 'mp4',
        videoFormats: videoFormats,
        typeOfContent: 'video' | 'playlist',
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

        this.axiosConfig = axios.create({
            baseURL: 'http://192.168.0.110:8080/api',
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
        const playlistInfo = await this.axiosConfig.post('/playlist', {
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
        const videoInfo = await this.axiosConfig.post('/video', {
            url: this.url,
            quality: this.format,
        })
        const data = videoInfo.data as videoContentRemoteApiReturn
        if (data['headers'] === null) {
            // error in download
            this.downloadAudio()
            return
        } else if (this.jobId === undefined) {
            this.setOutputText(
                `Download da música \n"${data.title}"\n iniciado!`
            )
            this.downloadFile(data)
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

    private downloadFile(data: videoContentRemoteApiReturn) {
        const fileWithPath = `${savePath}/${data.title}.${this.format}`

        try {
            RNFS.unlink(fileWithPath).then(() => {
                console.log('Previous file deleted')
            })
        } catch (err) {
            console.log('file not exists')
        }

        RNFS.downloadFile({
            fromUrl: data.url,
            toFile: fileWithPath,
            headers: data.headers,
            progress: (res) => {
                const progress = res.bytesWritten / res.contentLength
                this.progressBarManager(progress, false)
                this.setOutputText(`Progress: ${(progress * 100).toFixed(2)}%`)
                console.log(`Progress: ${(progress * 100).toFixed(2)}%`)
                console.log(
                    `ProgressBytes written: ${res.bytesWritten} | contentLength ${res.contentLength}`
                )
            },
            begin: (res) => {
                this.jobId = res.jobId
            },
        })
            .promise.then((response) => {
                console.log('File downloaded!', response)
                this.setOutputText('Download concluído')
                this.jobId = undefined
                this.downloadNextVideo()
            })
            .catch((err) => {
                console.log('Download error:')
                console.log(err)

                if (!err.toString().includes('aborted')) {
                    this.setOutputText('Erro no download!')
                }
            })
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
