const imgUrls = ["./assets/dog.png", "./assets/cat.png"]

const state = {
    images: [],
    canvas: null,
    canvasContext: null,
    dragging: false,
    dragData: null,
}

class CanvasImage {
    name
    data
    element
    selected
    context
    constructor(element, name, data, context) {
        this.element = element
        this.name = name
        this.selected = false
        this.context = context
        this.data = {}

        this.setData({
            width: element.width,
            height: element.height,
            ...data,
        })
    }

    setData(data) {
        this.data = { ...this.data, ...data }
        this.updatePercents()
    }
    updatePercents() {
        const { x: xMax, y: yMax } = this.max()

        const xPercent = this.data.x / xMax
        const yPercent = this.data.y / yMax

        this.data.xPercent = xPercent
        this.data.yPercent = yPercent
    }
    max() {
        const x = Math.max(0, this.context.canvas.width - this.data.width)
        const y = Math.max(0, this.context.canvas.height - this.data.height)

        return {
            x,
            y,
        }
    }
    select() {
        this.data.selected = true
    }
    unselect() {
        this.data.selected = false
    }
    draw() {
        const imageRect = new Path2D()
        imageRect.rect(0, 0, this.data.width, this.data.height)
        this.path = imageRect
        state.canvasContext.drawImage(
            this.element,
            this.data.x,
            this.data.y,
            this.data.width,
            this.data.height
        )
        if (this.data.selected) {
            this.drawStroke()
        }
    }

    drawStroke() {
        const { x, y, width, height } = this.data

        state.canvasContext.strokeStyle = "green"
        state.canvasContext.lineWidth = 2

        state.canvasContext.beginPath()
        state.canvasContext.rect(x, y, width, height)
        state.canvasContext.stroke()
        state.canvasContext.closePath()
    }
    isAtCoords({ x, y }) {
        const pos = this.getPosition()
        if (pos.start.x <= x && pos.end.x >= x && pos.start.y <= y && pos.end.y >= y) {
            return true
        }
        return false
    }
    getPosition() {
        const start = {
            x: this.data.x,
            y: this.data.y,
        }
        const end = {
            x: start.x + this.data.width,
            y: start.y + this.data.height,
        }
        return { start, end }
    }
    moveRelative(moveX, moveY) {
        const { x: maxX, y: maxY } = this.max()

        const x = Math.max(0, Math.min(maxX, this.data.x + moveX))
        const y = Math.max(0, Math.min(maxY, this.data.y + moveY))

        this.setData({ x, y })
    }
    adjustByPercent() {
        const { x: maxX, y: maxY } = this.max()

        const x = Math.max(0, Math.min(maxX, maxX * this.data.xPercent))
        const y = Math.max(0, Math.min(maxY, maxY * this.data.yPercent))

        this.setData({ x, y })
    }
}
async function loadImages(imageUrls) {
    const images = []
    for (let i = 0; i < imgUrls.length; i++) {
        try {
            const url = imageUrls[i]
            const element = await loadImage(url)
            const img = new CanvasImage(
                element,
                url.split("/").slice(-1)[0],
                {
                    x: 0,
                    y: 0,
                    i,
                },
                state
            )

            images.push(img)
        } catch (err) {
            console.error(err.message, err)
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

function clearCanvas() {
    state.canvasContext.clearRect(0, 0, state.canvas.width, state.canvas.height)
}
function render() {
    clearCanvas()
    drawImages()
}

function drawImages() {
    state.images.forEach((image) => image.draw())
}

function adjustCanvasSize() {
    const { innerWidth } = window
    state.canvas.width = innerWidth
    state.canvas.height = Math.floor((innerWidth / 16) * 9)
}

function selectImage(image) {
    state.images.forEach((i) => {
        if (image != i) {
            i.unselect()
        }
    })
    image.select()

    render()
}

function startDrag(e) {
    state.dragging = true
    const image = findImageByPosition(e)
    if (image) {
        selectImage(image)
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
    state.images.forEach((img) => {
        if (img.data.selected) {
            hadSelected = true
            img.unselect()
        }
    })
    if (hadSelected) {
        render()
    }
}

function findImageByPosition(e) {
    let found
    for (var i = state.images.length - 1; i > -1; i--) {
        const image = state.images[i]
        if (image.isAtCoords(e)) {
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

    data.image.moveRelative(moveX, moveY)

    state.dragData.x = e.x
    state.dragData.y = e.y

    render()
}
function adjustImagePositions() {
    state.images.forEach((image) => image.adjustByPercent())
}
function syncImagePositions() {
    state.images.forEach((image) => image.updatePercents())
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
    state.canvas = document.getElementById("canvas")
    state.canvasContext = state.canvas.getContext("2d")
    state.images = await loadImages(imgUrls)
}

window.addEventListener("load", async () => {
    await setInitialState()
    setCanvasListeners()
    setGlobalListeners()
    adjustCanvasSize()
    syncImagePositions()
    render()
})
