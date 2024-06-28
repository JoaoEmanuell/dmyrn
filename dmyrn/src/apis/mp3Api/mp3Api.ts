import { Dispatch, SetStateAction } from 'react'
import { Mp3ApiInterface } from '../../interfaces/mp3ApiInterface'
import { RNFS } from '../../lib/rnfs'
import axios, { Axios } from 'axios'
import { mp3ApiConverteds, mp3ApiStatusType } from '../../interfaces/types'
import { sleep } from '../../utils/sleep'

export class Mp3Api implements Mp3ApiInterface {
    private pathToFile: string
    setOutputText: Dispatch<SetStateAction<string>>
    progressBarManager: (percent?: number, infinite?: boolean) => void
    private mp3ApiUrl: string
    private jobId: number
    private filename: string
    private hash: string

    private axiosConfig: Axios

    constructor(
        setOutputText: Dispatch<SetStateAction<string>>,
        progressBarManager: (percent?: number, infinite?: boolean) => void
    ) {
        this.setOutputText = setOutputText
        this.progressBarManager = progressBarManager
        this.mp3ApiUrl = 'https://mp3-api.fly.dev/api'

        this.axiosConfig = axios.create({
            baseURL: 'https://mp3-api.fly.dev/api',
            timeout: 20000, // 20 seconds
        })
    }

    async start(pathToFile: string): Promise<boolean> {
        this.pathToFile = pathToFile
        this.filename = pathToFile.split('/').pop()
        console.log(pathToFile, this.filename)
        this.setOutputText('Iniciando conversão para mp3')
        await RNFS.uploadFiles({
            toUrl: `${this.mp3ApiUrl}/upload/`,
            files: [
                {
                    name: 'file',
                    filename: this.filename,
                    filepath: this.pathToFile,
                },
            ],
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            progress: (res) => {
                const progress =
                    res.totalBytesSent / res.totalBytesExpectedToSend
                this.progressBarManager(progress, false)
                this.setOutputText(`Progress: ${(progress * 100).toFixed(2)}%`)
            },
            begin: (res) => {
                this.jobId = res.jobId
                this.setOutputText('Enviando música')
            },
        })
            .promise.then(async (response) => {
                console.log('File uploaded!', response)
                const json = JSON.parse(response.body)
                console.log(json)
                this.hash = json['hash']
                this.setOutputText('Upload concluído')
                this.jobId = undefined
                await this.awaitConversion()
                await this.downloadFileConverted()
            })
            .catch((err) => {
                if (!err.toString().includes('aborted')) {
                    console.log('Upload error:')
                    console.log(err)
                    this.setOutputText('Erro no upload!')
                    this.progressBarManager(1)
                }
            })
        return true
    }

    stop() {
        if (this.jobId === undefined) {
            return false
        } else {
            RNFS.stopUpload(this.jobId)
            this.jobId = undefined
            return true
        }
    }

    private async awaitConversion(): Promise<boolean> {
        this.setOutputText('Conversão iniciada')
        const response = await this.axiosConfig.get(`/status/${this.hash}`)

        if (response.status === 200) {
            const json = response.data as mp3ApiStatusType
            console.log(json)

            if (json['status'] === false && json['total'] === undefined) {
            } else if (json['status'] === true) {
                this.setOutputText('Conversão concluída')
                this.progressBarManager(1)
                return true
            } else {
                // {"current": 512, "filename": "oh_profundidade__live_.mp3", "status": false, "total": 3789}
                const current = json.current
                const total = json.total
                const progress = Math.abs(1 - total / current / 10) // transform in percentage
                console.log(progress)
                this.progressBarManager(progress)
            }
        }
        await sleep(5000) // sleep
        this.awaitConversion()
    }

    private async downloadFileConverted(): Promise<boolean> {
        console.log('download file converted')

        const response = await this.axiosConfig.get(`/converteds/${this.hash}`)
        console.log(response)
        if (response.status === 200) {
            const json = response.data as mp3ApiConverteds
            await RNFS.unlink(this.pathToFile)
            await RNFS.downloadFile({
                fromUrl: json.audio,
                toFile: this.pathToFile,
                progress: (res) => {
                    const progress = res.bytesWritten / res.contentLength
                    this.progressBarManager(progress, false)
                    this.setOutputText(
                        `Progress: ${(progress * 100).toFixed(2)}%`
                    )
                },
                begin: (res) => {
                    this.jobId = res.jobId
                },
            })
                .promise.then(async (response) => {
                    console.log('File downloaded!', response)
                })
                .catch((err) => {
                    if (!err.toString().includes('aborted')) {
                        console.log('Download error:')
                        console.log(err)
                        this.setOutputText('Erro no download!')
                        this.progressBarManager(1)
                    }
                })
            return true
        }
    }
}
