# Solution Log

> Start Time: 20:24 (per git log)

### Getting Started

Just Read documentation. First impressions got me excited. I'm glad to finally have an excuse to do something like this.

Looked over starting code. Very happy with what they gave me to work with. Answered a lot of questions.

Made decisions on code implementation, based on directions:

-   not to use any third party libraries - for maximal flexibility as instructed
-   not to use compilers for the example. No bells and whistles, as javascript and the Canvas API seemed sufficient to fulfill parameters given.

### Learning API

Googled Canvas API

Checked out examples for drawing rectangles, shapes, and images.

Added window "resize" listener and callback.

Added properties to image data structure:

-   index - for constant time lookup, if needed
-   name - for ease in debugging
-   selected - to handle selected state

Googled canvas events. Determined there were no special drag events. Decided to go with combination of mouseup, mousedown, and mousemove.

Implemented listeners, and drag-related methods:

-   method to find image based on coords
-   startDrag - set dragging state
-   endDrag - end dragging / clear dragging state
-   moveSelectedImage - only activates when image is selected

Googled adding stroke to images. Determined an additional rectangle needed to be drawn over image's position. Implemented method for selected image. Took 2 tries to get a border that stopped existing after being cleared.

Stubbed out logic incrementally move image relative to mouse movement, using dragging state as "relative movement" measurement. Really having a lot of fun so far.

Added "bound" checks to make sure image never left bounds.

> Basic Working example: 22:11 (per git log)

Improved Image resizing

-   added automatically generated x, y percentages on image data change
-   add method on window "resize" to reposition images based on percentage, instead of max bounds

> Resize Position done: 22:42 (per git log)

At this point, I'm having way too much fun to stop. I believe I've met the requirements, but the application is very "sandboxy", as expected based on starter code. There is no scope, an no reusability.

Will experiment with the following ideas:

-   create CanvasImage class to consolidate image logic
-   create a CanvasImageContext class helper that AppClass will configure, with global getters for canvas.width, etc
-   create AppClass to encapsulate main app-related methods

> Converted code to use CanvasImage 23:34 (per git log)
>
> I had a lot of fun. Would love to implement remaining ideas, but am getting tired. Trying to weigh the time it would take vs benefit of getting code in great shape.
