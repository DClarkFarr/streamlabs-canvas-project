const imgUrls = ["./assets/dog.png", "./assets/cat.png"]

const state = {
    images: [],
    canvas: null,
    canvasContext: null,
    dragging: false,
    dragData: null,
}

async function loadImages(imageUrls) {
    const images = []
    for (let i = 0; i < imgUrls.length; i++) {
        try {
            const element = await loadImage(imageUrls[i])
            images.push({
                element,
                data: {
                    x: 0,
                    y: 0,
                    width: element.width,
                    height: element.height,
                    i,
                    selected: false,
                },
                name: imageUrls[i].split("/").slice(-1)[0],
            })
        } catch (err) {
            console.error(err.message)
        }
    }
    return images
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener("load", () => {
            resolve(image)
        })
        image.addEventListener("error", reject)
        image.src = src
    })
}

function render() {
    state.canvasContext.clearRect(0, 0, state.canvas.width, state.canvas.height)
    drawImages()
}

function drawImages() {
    state.images.forEach((image) => {
        const imageRect = new Path2D()
        imageRect.rect(0, 0, image.data.width, image.data.height)
        image.path = imageRect
        state.canvasContext.drawImage(
            image.element,
            image.data.x,
            image.data.y,
            image.data.width,
            image.data.height
        )
        if (image.data.selected) {
            addImageStroke(image)
        }
    })
}

function adjustCanvasSize() {
    const { innerWidth } = window
    state.canvas.width = innerWidth
    state.canvas.height = Math.floor((innerWidth / 16) * 9)
}

function selectImage(i) {
    const images = [...state.images].map((img) => {
        if (img.data.i == i) {
            img.data.selected = true
        } else {
            img.data.selected = false
        }

        return img
    })

    state.images = images

    render()
}

function addImageStroke(image) {
    const { x, y, width, height } = image.data

    state.canvasContext.strokeStyle = "green"
    state.canvasContext.lineWidth = 2

    state.canvasContext.beginPath()
    state.canvasContext.rect(x, y, width, height)
    state.canvasContext.stroke()
    state.canvasContext.closePath()
}
function startDrag(e) {
    state.dragging = true
    const image = findImageByPosition(e)
    if (image) {
        selectImage(image.data.i)
        state.dragData = {
            x: e.x,
            y: e.y,
            image,
        }
    } else {
        endDrag()
    }
}
function endDrag(e) {
    state.dragging = false
    state.dragData = null

    unselectAll()
}
function unselectAll() {
    let hadSelected = false
    const images = [...state.images].map((img) => {
        if (img.data.selected) {
            hadSelected = true
        }
        img.data.selected = false
        return img
    })
    if (hadSelected) {
        state.images = images
        render()
    }
}
function getImagePosition(image) {
    const start = {
        x: image.data.x,
        y: image.data.y,
    }
    const end = {
        x: start.x + image.data.width,
        y: start.y + image.data.height,
    }
    return { start, end }
}
function imageIsAtCoords(image, { x, y }) {
    const pos = getImagePosition(image)
    if (pos.start.x <= x && pos.end.x >= x && pos.start.y <= y && pos.end.y >= y) {
        return true
    }
    return false
}
function findImageByPosition(e) {
    const images = [...state.images].reverse()
    let found
    for (var i = 0; i < images.length; i++) {
        const image = images[i]
        if (imageIsAtCoords(image, e)) {
            found = image
            break
        }
    }

    return found
}

function moveSelectedImage(e) {
    const data = state.dragData
    const moveX = e.x - data.x
    const moveY = e.y - data.y

    const image = state.images[data.image.data.i]

    const maxX = state.canvas.width - image.data.width
    const maxY = state.canvas.height - image.data.height

    const toX = Math.max(0, Math.min(maxX, image.data.x + moveX))
    const toY = Math.max(0, Math.min(maxY, image.data.y + moveY))

    state.dragData.x = e.x
    state.dragData.y = e.y

    setImageData(image.data.i, { ...image.data, x: toX, y: toY })
    render()
}
function adjustImagePositions() {
    for (var i = 0; i < state.images.length; i++) {
        const image = state.images[i]
        const maxX = state.canvas.width - image.data.width
        const maxY = state.canvas.height - image.data.height

        const toX = Math.max(0, Math.min(maxX, image.data.x))
        const toY = Math.max(0, Math.min(maxY, image.data.y))

        if (maxX != toX || maxY != toY) {
            setImageData(i, { ...image.data, x: toX, y: toY })
        }
    }
}
function setImageData(i, data) {
    state.images[i].data = data
}
function setCanvasListeners() {
    state.canvas.addEventListener("mouseup", (e) => {
        e.stopPropagation()
        endDrag(e)
    })
    state.canvas.addEventListener("mousedown", (e) => {
        startDrag(e)
    })
    state.canvas.addEventListener("mousemove", (e) => {
        if (state.dragging) {
            moveSelectedImage(e)
        }
    })
}
function setGlobalListeners() {
    let windowResizeTimeout
    window.addEventListener("resize", () => {
        clearTimeout(windowResizeTimeout)
        windowResizeTimeout = setTimeout(() => {
            adjustCanvasSize()
            adjustImagePositions()
            render()
        }, 100)
    })

    document.getElementById("canvas-wrap").addEventListener("mouseup", () => {
        if (state.dragging) {
            endDrag()
        }
    })
}
async function setInitialState() {
    state.images = await loadImages(imgUrls)
    state.canvas = document.getElementById("canvas")
    state.canvasContext = state.canvas.getContext("2d")
}

window.addEventListener("load", async () => {
    await setInitialState()
    setCanvasListeners()
    setGlobalListeners()
    adjustCanvasSize()
    render()
})
