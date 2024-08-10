import { logger, fileAsyncTransport, consoleTransport } from 'react-native-logs'

import { logDir, RNFS } from '../lib/rnfs'

const date = new Date()

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
        fileName: `.dmyrn_log_${date.toISOString().replaceAll(':', '_')}.txt`,
        filePath: logDir,
    },
}

export var Logger = logger.createLogger(config)
try {
    let today = new Date()
    Logger.info(`---${today.toISOString()}---`)
} catch (err) {}
