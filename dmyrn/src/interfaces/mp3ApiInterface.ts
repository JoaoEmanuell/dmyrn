import { Dispatch, SetStateAction } from 'react'

export interface Mp3ApiInterface {
    start: (filepath) => Promise<boolean>
    stop: () => void
    setOutputText: Dispatch<SetStateAction<string>> // used to send messages to interface
    progressBarManager: (percent?: number, infinite?: boolean) => void // used to manage the progress bar
}
