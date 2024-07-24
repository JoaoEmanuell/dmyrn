interface PlaylistExtractorInterface {
    getVideos(url: string): Promise<string[]>
}
