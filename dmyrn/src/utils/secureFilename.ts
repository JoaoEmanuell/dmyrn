export const secureFilename = (unsecureFilename: string) => {
    return unsecureFilename.trim().replaceAll(' ', '_')
}
