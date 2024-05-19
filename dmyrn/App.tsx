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
import { videoFormats } from './src/interfaces/types'
import { RemoteDownloadApi } from './src/apis/remoteDownloadApi/remoteDownloadApi'

import { requestAndroidPermissions } from './src/lib/androidPermissions'

export default function App() {
    const [input, onChangeInput] = useState(
        'https://youtu.be/example?si=example'
    )
    const [progressBar, setProgressBar] = useState<JSX.Element | null>(null)
    const [outputText, setOutputText] = useState('')
    const [selectedItem, setSelected] = useState<videoFormats>('')
    const [formatSelected, setFormatSelected] = useState<'mp3' | 'mp4'>('mp3')
    const [dropdown, setDropdown] = useState<JSX.Element | null>(null)
    const [mp3ButtonColor, setMp3ButtonColor] = useState<'' | 'bg-gray-500'>('')
    const [remoteDownload, setRemoteDownload] =
        useState<RemoteDownloadApi | null>(null)
    const [downloadButtonText, setDownloadButtonText] = useState<
        'Baixar música ou playlist' | 'Parar download'
    >('Baixar música ou playlist')

    const data = [
        { key: '360', value: '360p' },
        { key: '720', value: '720p' },
    ]

    const pressDownloadButton = () => {
        if (downloadButtonText === 'Baixar música ou playlist') {
            startDownload()
        } else if (downloadButtonText === 'Parar download') {
            stopDownload()
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

    const startDownload = async () => {
        const urlValidator = UrlValidator(input)

        if (urlValidator.status) {
            const remoteDownload = new RemoteDownloadApi(
                input,
                formatSelected,
                selectedItem,
                urlValidator.type,
                setOutputText,
                progressBarManager
            )
            setRemoteDownload(remoteDownload)
            setDownloadButtonText('Parar download')
            await remoteDownload.download()
        } else {
            setOutputText('Url inválida!')
        }
    }

    const stopDownload = () => {
        remoteDownload.stopDownload()
        setDownloadButtonText('Baixar música ou playlist')
        setOutputText('Download cancelado')
        setProgressBar(null)
    }

    const progressBarManager = (percent?: number, infinite?: boolean) => {
        if (percent === 1) {
            // full progress bar
            setProgressBar(null)
            setDownloadButtonText('Baixar música ou playlist')
        } else if (infinite) {
            setProgressBar(
                <Circle size={80} indeterminate className="self-center" />
            )
        } else {
            setProgressBar(
                <Bar progress={percent} width={200} className="self-center" />
            )
        }
    }

    useEffect(() => {
        requestAndroidPermissions().then((_) => {})
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
                    text={downloadButtonText}
                    pressableClassName="mx-12"
                />
            </View>
            <View className="mt-4">
                <Text className="text-black text-center px-4">
                    {outputText}
                </Text>
            </View>
            <View className="mt-4 flex justify-center">{progressBar}</View>
        </ScrollView>
    )
}
