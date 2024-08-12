import React from 'react'
import { Pressable, Text } from 'react-native'

interface grayButtonInterface {
    onPress: () => void
    text: string
    pressableClassName?: string
    textClassName?: string
}

export default function GrayButton(props: grayButtonInterface) {
    return (
        <Pressable
            onPress={props.onPress}
            className={`bg-gray-300 p-4 rounded-xl ${props.pressableClassName} active:bg-gray-500`}
        >
            <Text className={`text-black text-center ${props.textClassName}`}>
                {props.text}
            </Text>
        </Pressable>
    )
}
