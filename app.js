/**
 * CANVAS IMAGE CLASS
 * Belongs to DraggableCanvas class
 * Renders the image it represents on its parent's canvas
 */
class CanvasImage {
    name
    data
    element
    selected
    parent

    /**
     *
     * @param element   <img> element
     * @param name      Base filename, for logging purposes
     * @param data      height, width, x, y, selected
     * @param parent    Parent DraggableCanvas class
     */
    constructor(element, name, data, parent) {
        this.element = element
        this.name = name
        this.selected = false
        this.parent = parent
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

    /**
     * Returns max possible x, y coordinates
     */
    max() {
        const x = Math.max(0, this.parent.canvas.width - this.data.width)
        const y = Math.max(0, this.parent.canvas.height - this.data.height)

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

    /**
     * Draw image on parent canvas
     */
    draw() {
        const imageRect = new Path2D()
        imageRect.rect(0, 0, this.data.width, this.data.height)
        this.path = imageRect
        this.parent.context.drawImage(
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

    /**
     * If selected, add stroke rect to image's location
     */
    drawStroke() {
        const { x, y, width, height } = this.data

        this.parent.context.strokeStyle = "green"
        this.parent.context.lineWidth = 2

        this.parent.context.beginPath()
        this.parent.context.rect(x, y, width, height)
        this.parent.context.stroke()
        this.parent.context.closePath()
    }

    /**
     * Checks if image is in x,y location of canvas
     * @param param X, Y coordinates
     */
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
    setPosition({ x, y }) {
        const { x: maxX, y: maxY } = this.max()

        x = Math.max(0, Math.min(maxX, x))
        y = Math.max(0, Math.min(maxY, y))

        this.setData({ x, y })
    }

    /**
     * Move image relative to current position
     * @param int moveX
     * @param int moveY
     */
    moveRelative(moveX, moveY) {
        this.setPosition({
            x: this.data.x + moveX,
            y: this.data.y + moveY,
        })
    }

    /**
     * Keeps image at it's current percent from max x, y bounds
     */
    adjustByPercent() {
        const { x: maxX, y: maxY } = this.max()

        this.setPosition({
            x: maxX * this.data.xPercent,
            y: maxY * this.data.yPercent,
        })
    }
}

/**
 * DRAGGABLE CANVAS OBJECT
 * Uses Canvas API to create a draggable interface.
 * Manages CanvasImage instances.
 *
 */
class DraggableCanvas {
    images = []
    canvas
    context
    dragging = false
    dragData

    constructor(canvas) {
        this.canvas = canvas
        this.context = canvas.getContext("2d")
        this.setListeners()
    }

    /**
     * @param url - reference to local file
     */
    async loadStaticImage(url) {
        try {
            const element = await Utils.loadImage(url)
            const img = new CanvasImage(
                element,
                url.split("/").slice(-1)[0],
                {
                    x: 0,
                    y: 0,
                },
                this
            )

            this.images.push(img)
        } catch (err) {
            console.error(err.message, err)
        }
    }
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    render() {
        this.clearCanvas()
        this.drawImages()
    }
    drawImages() {
        this.images.forEach((image) => image.draw())
    }

    /**
     * Set canvas height, width
     * Adjusts image positions, to keep them in bounds
     * Renders
     */
    setSize(width, height) {
        this.canvas.width = width
        this.canvas.height = height

        this.adjustImagePositions()
        this.render()
    }

    selectImage(image) {
        this.images.forEach((i) => {
            if (image != i) {
                i.unselect()
            }
        })
        image.select()

        this.render()
    }
    startDrag(e) {
        this.dragging = true
        const image = this.findImageByPosition(e)
        if (image) {
            this.selectImage(image)
            this.dragData = {
                x: e.x,
                y: e.y,
                image,
            }
        } else {
            this.endDrag()
        }
    }
    endDrag(e) {
        this.dragging = false
        this.dragData = null

        this.unselectAll()
    }
    unselectAll() {
        let hadSelected = false
        this.images.forEach((img) => {
            if (img.data.selected) {
                hadSelected = true
                img.unselect()
            }
        })
        if (hadSelected) {
            this.render()
        }
    }

    /**
     * Finds image by x, y coordinates
     * Finds image top (last rendered) image first.
     */
    findImageByPosition(e) {
        let found
        for (var i = this.images.length - 1; i > -1; i--) {
            const image = this.images[i]
            if (image.isAtCoords(e)) {
                found = image
                break
            }
        }

        return found
    }

    /**
     * Compares current x,y to previous x,y, to track the difference
     * Move image.
     * Set dragData x,y for use on next mousemove event
     * @param Event e - mousemove event
     */
    moveSelectedImage(e) {
        const data = this.dragData

        const moveX = e.x - data.x
        const moveY = e.y - data.y

        data.image.moveRelative(moveX, moveY)

        this.dragData.x = e.x
        this.dragData.y = e.y

        this.render()
    }
    adjustImagePositions() {
        this.images.forEach((image) => image.adjustByPercent())
    }

    /**
     * Canvas listeners.
     * - start drag on mousedown
     * - track drag in progress on mousemove
     * - end drag on mouseup
     */
    setListeners() {
        this.canvas.addEventListener("mouseup", (e) => {
            e.stopPropagation()
            this.endDrag(e)
        })
        this.canvas.addEventListener("mousedown", (e) => {
            this.startDrag(e)
        })
        this.canvas.addEventListener("mousemove", (e) => {
            if (this.dragging) {
                this.moveSelectedImage(e)
            }
        })
    }
}

/**
 * Util class / helper methods
 */
const Utils = {
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener("load", () => {
                resolve(image)
            })
            image.addEventListener("error", reject)
            image.src = src
        })
    },
}

/**
 * Page App Class
 * Receives DraggableCanvas instance
 * Watches window width, resizes main canvas instance
 */
class App {
    mainCanvas
    constructor() {
        this.listeners()
    }
    listeners() {
        let windowResizeTimeout
        window.addEventListener("resize", () => {
            clearTimeout(windowResizeTimeout)
            windowResizeTimeout = setTimeout(() => {
                if (this.mainCanvas) {
                    this.setMainCanvasSize()
                }
            }, 100)
        })

        window.addEventListener("mouseup", () => {
            if (this.mainCanvas && this.mainCanvas.dragging) {
                this.mainCanvas.endDrag()
            }
        })
    }
    setMainCanvas(mainCanvas) {
        this.mainCanvas = mainCanvas
        this.setMainCanvasSize()
    }
    render() {
        this.mainCanvas.render()
    }
    setMainCanvasSize() {
        const { innerWidth: width } = window
        const height = Math.floor((width / 16) * 9)
        this.mainCanvas.setSize(width, height)
    }
}

/**
 * Static URLS. Always loads by default
 */
const imgUrls = ["./assets/dog.png", "./assets/cat.png"]

const app = new App()

/**
 * Document Ready Listener
 */
window.addEventListener("load", async () => {
    /**
     * Initiate main canvas object class
     */
    const mainCanvas = new DraggableCanvas(document.getElementById("canvas"))

    app.setMainCanvas(mainCanvas)

    /**
     * Load Canvas images
     */
    for (var i = 0; i < imgUrls.length; i++) {
        await mainCanvas.loadStaticImage(imgUrls[i])
    }

    /**
     * Render app -> render canvas
     */
    app.render()
})
