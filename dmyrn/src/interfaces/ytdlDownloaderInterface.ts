import { PlaylistExtractor } from '../download/playlistExtractor'

export interface ytdlDownloadInterface {
    videoUrl: string
    quality: 140 | 22 | 18
    playlistExtractor: PlaylistExtractor
    progressBar(progress: number, infinite: boolean): void
    output(text: string): void
    download: () => {}
    cancel: () => {}
}
