import { logger, fileAsyncTransport, consoleTransport } from 'react-native-logs'

import { RNFS, savePath } from '../lib/rnfs'

const config = {
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    },
    transport: [consoleTransport, fileAsyncTransport],
    transportOptions: {
        FS: RNFS,
        fileName: `.dmyrn_log.txt`,
        filePath: savePath,
    },
}

export var Logger = logger.createLogger(config)
try {
    let today = new Date()
    Logger.info(`---${today.toISOString()}---`)
} catch (err) {}
