type urlValidatorReturn = {
    status: boolean
    type: 'video' | 'playlist' | undefined
}

/**
 * validate the url
 * @param url url to content
 * @returns `{ status: boolean (true if valide), type: { 'playlist' | 'video'}}`
 */
export function UrlValidator(url: string): urlValidatorReturn {
    const validHosts = ['youtu.be', 'music.youtube.com', 'youtube.com']
    let returnData: urlValidatorReturn = { status: false, type: undefined }

    validHosts.map((host) => {
        if (url.includes(host)) {
            if (url.includes('youtube.com/playlist?list=')) {
                // validate if is a playlist
                returnData = { status: true, type: 'playlist' }
            } else {
                returnData = { status: true, type: 'video' }
            }
        }
    })
    return returnData
}
