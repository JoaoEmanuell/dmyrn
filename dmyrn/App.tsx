import { useState, useEffect } from 'react'
import {
    ScrollView,
    TextInput,
    View,
    Text,
    AppState,
    Image,
} from 'react-native'
import { Bar, Circle } from 'react-native-progress'
import ReceiveSharingIntent from 'react-native-receive-sharing-intent'
import {
    Repeat,
    ArrowLeft,
    PlayCircle,
    ArrowRight,
    Shuffle,
    StopCircle,
} from 'lucide-react-native'

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
import { getYouTubeVideoId } from './src/utils/getYouTubeVideoId'

export default function App() {
    type buttonColor = '' | 'bg-gray-500'
    const [input, setInputText] = useState('')
    const [videoTitle, setVideoTitle] = useState('Video title')
    const [channelName, setChannelName] = useState('Channel name')
    const [playButton, setPlayButton] = useState(
        <PlayCircle color="black" size={32} />
    )
    const [thumbUri, setThumbUri] = useState(
        'https://img.youtube.com/vi/-IDzs6GncUk/sddefault.jpg'
    )
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
        { key: 'audio', value: 'audio' },
        { key: 'video', value: 'video' },
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
                        setInputText(file.weblink)
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

    const onChangeInput = (url: string = '') => {
        const inputText = url ? url : input.trim()
        if (inputText === '') return
        const videoId = getYouTubeVideoId(inputText)
        setThumbUri(`https://img.youtube.com/vi/${videoId}/sddefault.jpg`)
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
        <ScrollView className="bg-gray-100">
            <View className="flex items-center mt-4">
                <TextInput
                    placeholder="Url do YouTube"
                    placeholderTextColor={'gray'}
                    className="text-black px-4 m-4 bg-white rounded-full border w-[60%]"
                    value={input}
                    onEndEditing={() => {
                        onChangeInput()
                    }}
                    onChangeText={setInputText}
                />
            </View>
            <View className="bg-white rounded-lg mx-4">
                <View className="flex items-center">
                    <Image
                        source={{
                            uri: thumbUri,
                        }}
                        width={300}
                        height={300}
                        alt="video thumb"
                        style={{
                            resizeMode: 'contain',
                        }}
                    />
                </View>
                <View className="mx-4">
                    <Text className="text-black">{videoTitle}</Text>
                    <Text className="text-black font-bold">{channelName}</Text>
                </View>
                <View className="my-4 flex-row justify-around">
                    <Repeat color="black" size={32} />
                    <ArrowLeft color="black" size={32} />
                    {playButton}
                    <ArrowRight color="black" size={32} />
                    <Shuffle color="black" size={32} />
                </View>
                <View className="m-4 px-4">
                    <Dropdown
                        setSelected={(val) => setSelected(val)}
                        data={data}
                        onSelect={() => {
                            setFormatSelected('mp4')
                            setMp3ButtonColor('')
                        }}
                        placeholder="Baixar"
                        search={false}
                        key={getRandomElementKey()}
                    />
                </View>
            </View>
        </ScrollView>
    )
}
