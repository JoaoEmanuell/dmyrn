const release_api_endpoint = "https://api.github.com/repos/JoaoEmanuell/dmyrn/releases/latest"
const release_div = document.querySelector("#div-last-download")

async function request_get(url=''){
    const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        cache: "default",
        credentials: "same-origin",
        headers: {
            "Content-type": "application/json"
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
    })
    return response.json()
}

request_get(release_api_endpoint).then((data) => {
    const div_to_body_request = document.createElement("div")
    /*const link_to_download = document.createElement('a')
    link_to_download.classList.add('text-success')*/
    const armeabiV7aDownloadButton = document.createElement('a')
    const arm64V8aDownloadButton = document.createElement('a')
    const universalDownloadButton = document.createElement('a')
    const divToButtons = document.createElement('div')
    const buttons = [armeabiV7aDownloadButton, arm64V8aDownloadButton, universalDownloadButton]
    const buttonsColors = ['btn-success', 'btn-primary', 'btn-info']
    

    if (data.message == "Not Found"){
        div_to_body_request.innerHTML = "<h2>Não existe lançamentos disponíveis!</h2>"
        div_to_body_request.classList.add('text-danger')
    } else{
        let buttonCount = 1;
        buttons.map((button) => {
            button.classList.add('d-flex', 'justify-content-center', 'text-decoration-none')
            const span = document.createElement('span')
            span.innerHTML = `Versão ${buttonCount}`
            span.classList.add('btn', buttonsColors[buttonCount-1], 'p-2', 'd-block', 'mt-4', 'mx-4')
            span.style = "width: 200px;"
            button.appendChild(span)
            buttonCount++
        })
        release_div.classList.add('shadow-lg', 'p-4', 'rounded', 'bg-light')
        div_to_body_request.innerHTML = `<pre>${data.body}</pre>`
        div_to_body_request.classList.add('text-dark')
        console.log(data);
        data.assets.map((asset) => {
            const splitUrl = asset.browser_download_url.split('/')
            const apkVersion = splitUrl[splitUrl.length - 1].split('-')[0]
            switch (apkVersion) {
                case '1':
                    armeabiV7aDownloadButton.href = asset.browser_download_url
                    break
                case '2':
                    arm64V8aDownloadButton.href = asset.browser_download_url
                    break
                case '5':
                    universalDownloadButton.href = asset.browser_download_url
                    break
            }
            
        })
        
        /*link_to_download.innerHTML = 'Clique aqui para baixar a nova versão!'
        link_to_download.href = data.assets[0].browser_download_url*/
    }
    divToButtons.append(...buttons)
    release_div.append(div_to_body_request, ...buttons)
})