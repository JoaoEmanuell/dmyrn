export const getYouTubeVideoId = (url: string) => {
    if (url.includes('youtube.com/watch')) {
        // get the id and remove the sig
        return url.split('?')[1].replace('v=', '').split('&')[0]
    }
}
