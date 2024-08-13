- [Dmyrn](#dmyrn)
  - [Features](#features)
  - [Running Locally](#running-locally)
  - [Deployment](#deployment)
  - [Tech Stack](#tech-stack)
  - [Authors](#authors)
  - [License](#license)

[Português Brasil](./README-pt_br.md)

# Dmyrn

Dmyrn (Download Music YouTube React Native) is an Android application designed to allow users to download videos and music from YouTube for free.

<p align="center">
  <img src="./docs/images/icon.png" alt="icon" width="100px"/>
</p>

## Features

- Download videos and playlists.
- Local conversion of music to MP3 format.
- Saving files to the device's internal memory.
- Notifications.
- Background operation.

## Running Locally

Requirements

```bash
node >= 19.9.0
npm >= 9.6.3
openjdk >= 21.0.4
```

Clone the project:

```bash
git clone https://github.com/JoaoEmanuell/dmyrn.git
```

Navigate to the project directory:

```bash
cd dmyrn
```

Install the dependencies:

```bash
npm install
```

Navigate to the Android directory `dmyrn/android/app`.

Copy the `build_example.gradle` file and rename it to `build.gradle`.

Connect your Android device via USB or run an emulator.

Start Android:

```bash
npm run android
```

Start the server:

```bash
npm run start
```

## Deployment

To deploy this project, follow these steps:

Generate a release *keystore*:

```bash
keytool -genkey -v -keystore release.keystore -alias <keyAlias> -keyalg RSA -keysize 2048 -validity 10000
```

Fill in the desired information. Then, within `build.gradle`, replace the saved data with your key's information:

```
storeFile file('release.keystore')
storePassword '<password>'
keyAlias '<your_key_alias>'
keyPassword '<password>'
```

## Tech Stack

- React Native
- TypeScript
- TailwindCSS
- [FFmpeg](https://github.com/arthenica/ffmpeg-kit)
- [React Native ytdl](https://github.com/ytdl-js/react-native-ytdl) (updated to work currently)

## Authors

- [@JoaoEmanuell](https://www.github.com/JoaoEmanuell)

## License

[MIT](https://github.com/JoaoEmanuell/dmyrn/blob/master/LICENSE)
