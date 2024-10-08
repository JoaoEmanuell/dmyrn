- [Dmyrn](#dmyrn)
  - [Funcionalidades](#funcionalidades)
  - [Download](#download)
  - [Rodando localmente](#rodando-localmente)
  - [Deploy](#deploy)
  - [Stack utilizada](#stack-utilizada)
  - [Autores](#autores)
  - [Licença](#licença)


# Dmyrn

Dmyrn (Download Music YouTube React Native) é uma aplicação Android cujo propósito é permitir que o usuário faça o download de vídeos e músicas do YouTube de forma gratuita.

<p align="center">
  <img src="./docs/images/icon.png" alt="icon" width="100px"/>
</p>

## Funcionalidades

- Download de vídeos e playlists.
- Conversão local das músicas para o formato MP3.
- Salvamento dos arquivos na memória interna do dispositivo.
- Notificações
- Funcionamento em background

## Download

Acesse o [site](https://joaoemanuell.github.io/dmyrn/html/download.html) ou a página de [releases](https://github.com/JoaoEmanuell/dmyrn/releases)

## Rodando localmente

Requisitos

```bash
node >= 19.9.0
npm >= 9.6.3
openjdk >= 21.0.4
```

Clone o projeto:

```bash
git clone https://github.com/JoaoEmanuell/dmyrn.git
```

Entre no diretório do projeto:

```bash
cd dmyrn
```

Instale as dependências:

```bash
npm install
```

Navegue até o diretório do Android `dmyrn/android/app`.

Copie o arquivo `build_example.gradle` e renomeie-o para `build.gradle`.

Conecte o seu dispositivo Android via USB ou execute um emulador.

Inicie o Android:

```bash
npm run android
```

Inicie o servidor:

```bash
npm run start
```

## Deploy

Para fazer o deploy deste projeto, siga as seguintes etapas.

Gere uma *keystore* de *release*:

```bash
keytool -genkey -v -keystore release.keystore -alias <keyAlias> -keyalg RSA -keysize 2048 -validity 10000
```

Preencha com os dados desejados. Após isso, dentro do `build.gradle`, substitua os dados salvos pelos dados da chave:

```
storeFile file('release.keystore')
storePassword '<password>'
keyAlias '<your_key_alias>'
keyPassword '<password>'
```

## Stack utilizada

- React Native
- TypeScript
- TailwindCSS
- [FFmpeg](https://github.com/arthenica/ffmpeg-kit)
- [React Native ytdl](https://github.com/ytdl-js/react-native-ytdl) (atualizado para funcionar atualmente)

## Autores

- [@JoaoEmanuell](https://www.github.com/JoaoEmanuell)

## Licença

[MIT](https://github.com/JoaoEmanuell/dmyrn/blob/master/LICENSE)
