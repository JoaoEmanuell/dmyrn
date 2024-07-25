interface PlaylistExtractorInterface {
    /**
     *
     * @param url url to playlist
     * @returns return a list of string with urls to videos
     */
    getVideos(url: string): Promise<string[]>
}
