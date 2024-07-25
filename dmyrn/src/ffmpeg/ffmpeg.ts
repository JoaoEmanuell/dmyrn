import { FFmpegKit, FFmpegKitConfig } from 'ffmpeg-kit-react-native'
import { unlinkFile } from '../utils/unlinkFile'
import { FfmpegInterface } from '../interfaces/ffmpegInterface'

export class Ffmpeg implements FfmpegInterface {
    private stopConversion: boolean = false
    async initFfmpeg(): Promise<boolean> {
        console.log('init ffmpeg')

        await FFmpegKitConfig.init()
        return true
    }

    async convertM4aToMp3(
        filenameSavedInCacheDir: string,
        progressBar: (progress: number, infinite: boolean) => void
    ): Promise<string> {
        console.log('start convert to mp3')
        const treatedFilenameSavedInCacheDir = filenameSavedInCacheDir.replace(
            '.m4a',
            'mp3'
        ) // remove the .m4a

        // Step 1: Get the total duration of the input file
        const durationCommand = `-i "${filenameSavedInCacheDir}" -hide_banner`
        let totalDuration = 0

        await FFmpegKit.execute(durationCommand).then((session) => {
            session.getOutput().then((logs) => {
                const durationRegex = /Duration: (\d+):(\d+):(\d+\.\d+)/
                const match = logs.match(durationRegex)
                if (match) {
                    const hours = parseFloat(match[1])
                    const minutes = parseFloat(match[2])
                    const seconds = parseFloat(match[3])
                    totalDuration = hours * 3600 + minutes * 60 + seconds
                }
            })
        })

        await new Promise((resolve, reject) => {
            FFmpegKit.executeAsync(
                `-y -i "${filenameSavedInCacheDir}" -c:a libmp3lame -q:a 8 "${treatedFilenameSavedInCacheDir}.mp3"`,
                async (session) => {
                    // used to await the finished conversion for return the path to mp3 file
                    const returnCode = await session.getReturnCode()
                    returnCode.isValueSuccess()
                        ? resolve(null)
                        : reject('Conversion failed')
                },
                (log) => {},
                (statistics) => {
                    // Step 2: Calculate the conversion progress percentage
                    const time = statistics.getTime() / 1000 // time in seconds
                    const progress = time / totalDuration
                    if (!this.stopConversion) {
                        progressBar(progress, false)
                    } else {
                        // hidden the progress bar if conversion is stoped
                        progressBar(-1, false)
                    }
                    // console.log(`Conversion Progress: ${progress.toFixed(2)}%`)
                }
            ).catch((err) => {
                reject(err)
            })
        })
        unlinkFile(filenameSavedInCacheDir)
        return `${treatedFilenameSavedInCacheDir}.mp3`
    }

    async stop() {
        this.stopConversion = true
        await FFmpegKit.cancel()
    }
}
