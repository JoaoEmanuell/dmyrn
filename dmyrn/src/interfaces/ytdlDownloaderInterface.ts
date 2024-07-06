export interface ytdlDownloadInterface {
    videoUrl: string
    quality: 140 | 22 | 18
    progressBar(progress: number, infinite: boolean): void
    output(text: string): void
    download: () => {}
    cancel: () => {}
}
