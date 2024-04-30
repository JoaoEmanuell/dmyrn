/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable semi */
/* eslint-disable react/react-in-jsx-scope */

import { useState, useEffect } from 'react'
import { ScrollView, TextInput, View, Text } from 'react-native'
import { Bar, Circle } from 'react-native-progress'

import GrayButton from './components/ui/GrayButton'
import Dropdown from './components/ui/Dropdown'
import { getRandomElementKey } from './src/randomElementKey'

export default function App() {
    const [input, onChangeInput] = useState('')
    const [progressBar, setProgressBar] = useState<JSX.Element | null>(null)
    const [outputText, setOutputText] = useState('')
    const [selectedItem, setSelected] = useState<'360' | '720' | ''>('')
    const [formatSelected, setFormatSelected] = useState<'mp3' | 'mp4'>('mp3')
    const [dropdown, setDropdown] = useState<JSX.Element | null>(null)
    const [mp3ButtonColor, setMp3ButtonColor] = useState<'' | 'bg-gray-500'>('')

    const data = [
        { key: '360', value: '360p' },
        { key: '720', value: '720p' },
    ]

    const pressDownloadButton = () => {
        console.log(input)
        console.log(selectedItem)
        console.log(formatSelected)
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

    useEffect(() => {
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
            <View className="mt-4">{progressBar}</View>
        </ScrollView>
    )
}
