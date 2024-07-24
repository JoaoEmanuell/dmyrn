/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable semi */
/* eslint-disable react/react-in-jsx-scope */

import { useState, useEffect } from 'react'
import { ScrollView, TextInput, View, Text } from 'react-native'
import { Bar, Circle } from 'react-native-progress'
import { UrlValidator } from './src/urlValidator/urlValidator'

import GrayButton from './components/ui/GrayButton'
import Dropdown from './components/ui/Dropdown'
import { getRandomElementKey } from './src/lib/randomElementKey'
import { ytdlDownload } from './src/download/ytdlDownloader'
import { requestAndroidPermissions } from './src/lib/androidPermissions'
import { PlaylistExtractor } from './src/download/playlistExtractor'

export default function App() {
    const [input, onChangeInput] = useState(
        'https://youtu.be/example?si=example'
    )
    const [progressBar, setProgressBar] = useState<JSX.Element | null>(null)
    const [outputText, setOutputText] = useState('')
    const [selectedItem, setSelected] = useState<'360' | '720' | ''>('')
    const [formatSelected, setFormatSelected] = useState<'mp3' | 'mp4'>('mp3')
    const [dropdown, setDropdown] = useState<JSX.Element | null>(null)
    const [mp3ButtonColor, setMp3ButtonColor] = useState<'' | 'bg-gray-500'>('')
    const [downloadStatus, setDownloadStatus] = useState(true) // if true download is allowed, else stop the download
    const [ytdlInstance, setYtdlInstance] = useState<undefined | ytdlDownload>()

    const data = [
        { key: '360', value: '360p' },
        { key: '720', value: '720p' },
    ]

    const pressDownloadButton = async () => {
        console.log(selectedItem)
        console.log(formatSelected)
        console.log(input)

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
                    new PlaylistExtractor()
                )
                setYtdlInstance(ytdlDownloadInstance)
                await ytdlDownloadInstance.download()
            }
        } else {
            setOutputText('Url inválida!')
        }
    }

    const onPressMp3Button = () => {
        setFormatSelected('mp3')
        setDropdown(getDropdown)
        setMp3ButtonColor('bg-gray-500')
    }

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

    const setProgressBarValue = (
        progress: number,
        infinite: boolean = false
    ) => {
        if (infinite) {
            setProgressBar(<Circle size={30} indeterminate />)
        } else if (progress === -1) {
            setProgressBar(undefined)
        } else {
            setProgressBar(<Bar progress={progress} width={200} />)
        }
    }

    useEffect(() => {
        requestAndroidPermissions()
        setDropdown(getDropdown())
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
                    text="Baixar música ou playlist"
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
