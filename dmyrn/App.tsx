import { useState, useEffect } from 'react'
import { ScrollView, TextInput, View, Text, AppState } from 'react-native'
import { Bar, Circle } from 'react-native-progress'
import ReceiveSharingIntent from 'react-native-receive-sharing-intent'

import { UrlValidator } from './src/urlValidator/urlValidator'
import GrayButton from './components/ui/GrayButton'
import Dropdown from './components/ui/Dropdown'
import { getRandomElementKey } from './src/lib/randomElementKey'
import { ytdlDownload } from './src/download/ytdlDownloader'
import { requestAndroidPermissions } from './src/lib/androidPermissions'
import { PlaylistExtractor } from './src/download/playlistExtractor'
import { Ffmpeg } from './src/ffmpeg/ffmpeg'
import { Logger } from './src/utils/log'
import { fileIntent } from './src/interfaces/types'
import { Notification } from './src/notification/notification'
import { Updater } from './src/updater/updater'

export default function App() {
    type buttonColor = '' | 'bg-gray-500'
    const [input, onChangeInput] = useState('')
    const [progressBar, setProgressBar] = useState<JSX.Element | null>(null)
    const [outputText, setOutputText] = useState('')
    const [selectedItem, setSelected] = useState<'360' | '720' | ''>('')
    const [formatSelected, setFormatSelected] = useState<'mp3' | 'mp4'>('mp3')
    const [dropdown, setDropdown] = useState<JSX.Element | null>(null)
    const [mp3ButtonColor, setMp3ButtonColor] = useState<buttonColor>('')
    const [downloadStatus, setDownloadStatus] = useState(true) // if true download is allowed, else stop the download
    const [textDownloadButton, setTextDownloadButton] = useState<
        'Baixar música ou playlist' | 'Parar download'
    >('Baixar música ou playlist')
    const [ytdlInstance, setYtdlInstance] = useState<undefined | ytdlDownload>()
    const [notificationInstance, setNotificationInstance] = useState<
        undefined | Notification
    >()
    let lastProgressBarUpdate: Date | undefined = undefined

    const data = [
        { key: '360', value: '360p' },
        { key: '720', value: '720p' },
    ]

    /**
     * used to start / stop download
     * @returns void
     */
    const pressDownloadButton = async () => {
        if (downloadStatus === false) {
            // stop download
            await ytdlInstance.cancel()
            setOutputText('Download cancelado')
            setDownloadStatus(true)
            setProgressBarValue(-1)
            setTextDownloadButton('Baixar música ou playlist')
            return
        }

        const urlValidator = UrlValidator(input)

        if (urlValidator.status) {
            if (downloadStatus) {
                let selectedQuality
                if (formatSelected === 'mp3') {
                    selectedQuality = formatSelected
                } else {
                    selectedQuality = selectedItem
                }
                const ytdlDownloadInstance = new ytdlDownload(
                    input,
                    selectedQuality,
                    setProgressBarValue,
                    setOutputText,
                    messageFinishedDownload,
                    new PlaylistExtractor(),
                    new Ffmpeg(),
                    notificationInstance
                )
                setYtdlInstance(ytdlDownloadInstance)
                setDownloadStatus(false)
                setTextDownloadButton('Parar download')
                await ytdlDownloadInstance.download()
            }
        } else {
            setOutputText('Url inválida!')
        }
    }

    /**
     * reset dropdown, change the mp3 button color, and set the format to mp3
     */

    const onPressMp3Button = () => {
        setFormatSelected('mp3')
        setDropdown(getDropdown)
        setMp3ButtonColor('bg-gray-500')
    }

    /**
     * get a initial dropdown
     * @returns Dropdown component
     */

    const getDropdown = () => {
        return (
            <Dropdown
                setSelected={(val) => setSelected(val)}
                data={data}
                onSelect={() => {
                    setFormatSelected('mp4')
                    setMp3ButtonColor('')
                }}
                placeholder="MP4"
                search={false}
                key={getRandomElementKey()}
            />
        )
    }

    /**
     * progress bar manage
     * @param progress number of progress, in decimal, if is equal to -1, then hidden progressbar
     * @param infinite if true, then progress bar set to a circle, else progress bar set to a bar
     */

    const setProgressBarValue = (
        progress: number,
        infinite: boolean = false
    ) => {
        const handlerChangeProgressToValue = (progress, date) => {
            lastProgressBarUpdate = date
            setProgressBar(<Bar progress={progress} width={200} />)
            notificationInstance.progressNotification(progress)
        }
        if (progress === -1) {
            setProgressBar(undefined)
            notificationInstance.progressNotification(-1)
        } else if (infinite) {
            setProgressBar(<Circle size={30} indeterminate />)
        }
        const date = new Date()
        if (lastProgressBarUpdate !== undefined) {
            const seconds =
                Math.abs(lastProgressBarUpdate.getTime() - date.getTime()) /
                1000

            if (seconds < 2) {
                // change in 2 a 2 seconds
                return
            } else {
                handlerChangeProgressToValue(progress, date)
            }
        } else {
            handlerChangeProgressToValue(progress, date)
        }
    }

    /**
     * used by ytdl downloader when finished all downloads
     */
    const messageFinishedDownload = () => {
        setProgressBarValue(-1)
        setDownloadStatus(true)
        setTextDownloadButton('Baixar música ou playlist')
    }

    const getIntent = () => {
        ReceiveSharingIntent.getReceivedFiles(
            (files: fileIntent[]) => {
                Logger.debug(`receive sharing`)
                files.map((file) => {
                    if (file.weblink) {
                        onChangeInput(file.weblink)
                    }
                })
            },
            (err) => {
                if (
                    err.toString() !==
                    "Error: java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.String android.content.Intent.getAction()' on a null object reference"
                ) {
                    //normal error :/
                    Logger.error(`intent error: ${err}`)
                }
            }
        )
    }

    useEffect(() => {
        requestAndroidPermissions()
        setDropdown(getDropdown())
        const ffmpeg = new Ffmpeg()
        ffmpeg.initFfmpeg()
        // get the intent
        getIntent()
        AppState.addEventListener('change', getIntent)
        const notification = new Notification()
        setNotificationInstance(notification)
        // updater
        const updater = new Updater()
        updater.verifyIfHasAnUpdate()
    }, [])

    return (
        <ScrollView className="bg-white">
            <View>
                <TextInput
                    placeholder="Link do vídeo ou playlist"
                    placeholderTextColor={'black'}
                    className="text-center text-black p-4 m-4 bg-gray-200 rounded-lg"
                    value={input}
                    onChangeText={onChangeInput}
                />
            </View>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                className="self-center"
            >
                <GrayButton
                    onPress={onPressMp3Button}
                    text="MP3"
                    pressableClassName={`w-20 mr-4 ${mp3ButtonColor}`}
                />
                {dropdown}
            </View>
            <View className="mt-4">
                <GrayButton
                    onPress={pressDownloadButton}
                    text={textDownloadButton}
                    pressableClassName="mx-12"
                />
            </View>
            <View className="mt-4">
                <Text className="text-black text-center">{outputText}</Text>
            </View>

            <View
                className="mt-4 self-center"
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                {progressBar}
            </View>
        </ScrollView>
    )
}
