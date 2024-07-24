export class PlaylistExtractor implements PlaylistExtractorInterface {
    async getVideos(url: string): Promise<string[]> {
        const threatedUrl = this.convertsToYouTubePlaylist(url)
        const response = await fetch(threatedUrl)
        const text = await response.text()

        const regex = /(\{\"url\":\"\/watch\?v=\w+)/g
        var matches = []
        var match

        while ((match = regex.exec(text)) !== null) {
            matches.push(match[0])
        }

        const uniqueVideos = []
        const baseYTUrl = 'https://www.youtube.com/watch?v='

        matches.forEach((match) => {
            // {"url":"/watch?v=hsZVlDQEwnI
            const treatedMatch = match.split('v=')
            const videoId = treatedMatch[1]
            const videoUrl = `${baseYTUrl}${videoId}`
            if (!uniqueVideos.includes(videoUrl)) {
                uniqueVideos.push(videoUrl)
            }
        })

        return uniqueVideos as string[]
    }

    private convertsToYouTubePlaylist = (url) => {
        if (url.includes('music')) {
            return url.replace('music', 'www')
        }
        return url
    }
}
