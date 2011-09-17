// Chrome hack
window.URL = window.URL || window.webkitURL;

// File and image representation of the document
var imageFile;
var imageCanvas;
var image;

var scale = 1;

// Faatures found
var features;

// holds all our boxes
var boxes = []; 

// New, holds the 8 tiny boxes that will be our selection handles
// the selection handles will be in this order:
// 0    1    2
// 3         4
// 5    6    7
var selectionHandles = [];

// Hold canvas formativeation
var canvas;
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 20;    // how often, in milliseconds, we check to see if a
                      // redraw is needed

var isDrag = false;
var isResizeDrag = false;
var expectResize = -1;  // New, will save the # of the selection handle if the
                        // mouse is over one.
var mx, my; // mouse coordinates

 // when set to true, the canvas will redraw everything
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned
// into an array
var mySel = null;

// The selection color and width. Right now we have a red selection with a
// small width
var mySelColor = '#CC0000';
var mySelWidth = 2;
var mySelBoxColor = 'darkred'; // New for selection boxes
var mySelBoxSize = 6;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;


function canvas_arrow(context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),
            toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),
            toy-headlen*Math.sin(angle+Math.PI/6));
}

// Box object to hold data
function Feature() {
    this.x = 0;
    this.y = 0;
    this.w = 1;
    this.h = 1;
    this.type = '';
    this.text = '';
}

// New methods on the Box class
Feature.prototype = {
    // mainDraw() will call this with the normal canvas
    // myDown will call this with the ghost canvas with 'black'
    draw: function(context, optionalColor) {
            if (context === gctx) {
                // black for the ghost canvas
                context.fillStyle = 'black';  
            } else {
                switch(this.type){
                    case 'LINE':
                        context.fillStyle = 'rgba(0,205,0,0.7)'; // Green
                        break;
                    case 'TEXTBOX':
                        context.fillStyle = 'rgba(2,165,165,0.7)'; // Green/blue
                        break;
                    case 'CHECKBOX':
                        context.fillStyle = 'rgba(150,150,250,0.7)'; // Purle
                        break;
                    case 'LABEL': 
                        context.fillStyle = 'rgba(128,128,128,0.9)'; // Gray
                        break;
                    case 'TEXT':
                        context.fillStyle = 'rgba(255,255,255,0.9)'; // BLUE
                        break;        
                }
            }
            
            // We can skip the drawing of elements that have moved off the screen:
            if (this.x > WIDTH || this.y > HEIGHT) return; 
            if (this.x + this.w < 0 || this.y + this.h < 0) return;
            
            context.fillRect(this.x,this.y,this.w,this.h);
            
        // draw selection
        // this is a stroke along the box and also 8 new selection handles
        if (mySel === this) {
            context.strokeStyle = mySelColor;
            context.lineWidth = mySelWidth;
            context.strokeRect(this.x,this.y,this.w,this.h);
            
            // draw the boxes
            
            var half = mySelBoxSize / 2;
            
            // 0    1    2
            // 3         4
            // 5    6    7
            
            // top left, middle, right
            selectionHandles[0].x = this.x-half;
            selectionHandles[0].y = this.y-half;
            
            selectionHandles[1].x = this.x+this.w/2-half;
            selectionHandles[1].y = this.y-half;
            
            selectionHandles[2].x = this.x+this.w-half;
            selectionHandles[2].y = this.y-half;
            
            //middle left
            selectionHandles[3].x = this.x-half;
            selectionHandles[3].y = this.y+this.h/2-half;
            
            //middle right
            selectionHandles[4].x = this.x+this.w-half;
            selectionHandles[4].y = this.y+this.h/2-half;
            
            //bottom left, middle, right
            selectionHandles[6].x = this.x+this.w/2-half;
            selectionHandles[6].y = this.y+this.h-half;
            
            selectionHandles[5].x = this.x-half;
            selectionHandles[5].y = this.y+this.h-half;
            
            selectionHandles[7].x = this.x+this.w-half;
            selectionHandles[7].y = this.y+this.h-half;

            
            context.fillStyle = mySelBoxColor;
            for (var i = 0; i < 8; i ++) {
                var cur = selectionHandles[i];
                context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
            }
        }
        
        // Draw text
        context.textBaseline = 'bottom';
        context.font = "bold 11px sans-serif";
        context.fillStyle = 'rgba(0,0,0,1.0)';
        context.fillText(this.text, this.x, this.y+this.h);

        // Draw arrow
        if(this.type === 'LABEL'){
            var from = this;
            var bb = features[this.target].bounding_box
            var to = {'x':bb[0],'y':bb[1],'w':bb[2],'h':bb[3]};
            //var msg = "from (" + from.x + "," + from.y + ") to (" + to.x + "," + to.y + ")";
            //console.log(msg);
            context.strokeStyle = "#a00";
            context.lineWidth   = 2;
            canvas_arrow(context, from.x, from.y, to.x, to.y);
            context.stroke();
        }
        
    } // end draw

}

//Initialize a new Box, add it, and invalidate the canvas
function addRect(type, x, y, w, h, text, target) {
    var rect = new Feature;
    rect.type = type;
    rect.x = x;
    rect.y = y;
    rect.w = w
    rect.h = h;
    rect.text = text;
    rect.target = target;
    boxes.push(rect);
    invalidate();
}


function initCanvas(){
    $("#process").show();
    $("#process").click(upload);
    scale = calc_scale(960, 0, image);
    HEIGHT = image.height*scale;
    WIDTH = image.width*scale;

    canvas = document.getElementById('canvas2');
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function initVerify() {

    ghostcanvas = document.createElement('canvas');
    ghostcanvas.height = HEIGHT;
    ghostcanvas.width = WIDTH;
    gctx = ghostcanvas.getContext('2d');
                
    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.onselectstart = function () { return false; }
    
    // fixes mouse co-ordinate problems when there's a border or padding
    // see getMouse for more detail
    if (document.defaultView && document.defaultView.getComputedStyle) {
        stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)         || 0;
        stylePaddingTop    = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)            || 0;
        styleBorderLeft    = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        styleBorderTop     = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)    || 0;
    }
    
    // make mainDraw() fire every INTERVAL milliseconds
    setInterval(mainDraw, INTERVAL);
    
    // set our events. Up and down are for dragging,
    // double click is for making new boxes
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.ondblclick = myDblClick;
    canvas.onmousemove = myMove;
    
    // set up the selection handle boxes
    for (var i = 0; i < 8; i ++) {
        var rect = new Feature;
        selectionHandles.push(rect);
    }
    
    // add custom initialization here:
    
    for(var id in features){
        feature = features[id];
        
        addRect(
                feature.type,
                feature['bounding_box'][0],
                feature['bounding_box'][1],
                feature['bounding_box'][2],
                feature['bounding_box'][3],
                feature['val'],
                feature.target
        );
    }

}

//wipes the canvas context
function clear(c) {
    c.clearRect(0, 0, WIDTH, HEIGHT);
}

// Main draw loop.
// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function mainDraw() {
    if (canvasValid == false) {
        clear(ctx);
        
        // Draw background image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // draw all boxes
        var l = boxes.length;
        for (var i = 0; i < l; i++) {
            boxes[i].draw(ctx); // we used to call drawshape, but now each box draws itself
        }
        
        // Add stuff you want drawn on top all the time here
        
        canvasValid = true;
    }
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
    if (isDrag) {
        getMouse(e);
        
        mySel.x = mx - offsetx;
        mySel.y = my - offsety;     
        
        // something is changing position so we better invalidate the canvas!
        invalidate();
    } else if (isResizeDrag) {
        // time ro resize!
        var oldx = mySel.x;
        var oldy = mySel.y;
        
        // 0    1    2
        // 3         4
        // 5    6    7
        switch (expectResize) {
            case 0:
                mySel.x = mx;
                mySel.y = my;
                mySel.w += oldx - mx;
                mySel.h += oldy - my;
                break;
            case 1:
                mySel.y = my;
                mySel.h += oldy - my;
                break;
            case 2:
                mySel.y = my;
                mySel.w = mx - oldx;
                mySel.h += oldy - my;
                break;
            case 3:
                mySel.x = mx;
                mySel.w += oldx - mx;
                break;
            case 4:
                mySel.w = mx - oldx;
                break;
            case 5:
                mySel.x = mx;
                mySel.w += oldx - mx;
                mySel.h = my - oldy;
                break;
            case 6:
                mySel.h = my - oldy;
                break;
            case 7:
                mySel.w = mx - oldx;
                mySel.h = my - oldy;
                break;
        }
        
        invalidate();
    }
    
    getMouse(e);
    // if there's a selection see if we grabbed one of the selection handles
    if (mySel !== null && !isResizeDrag) {
        for (var i = 0; i < 8; i++) {
            // 0    1    2
            // 3         4
            // 5    6    7
            
            var cur = selectionHandles[i];
            
            // we dont need to use the ghost context because
            // selection handles will always be rectangles
            if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
                    my >= cur.y && my <= cur.y + mySelBoxSize) {
                // we found one!
                expectResize = i;
                invalidate();
                
                switch (i) {
                    case 0:
                        this.style.cursor='nw-resize';
                        break;
                    case 1:
                        this.style.cursor='n-resize';
                        break;
                    case 2:
                        this.style.cursor='ne-resize';
                        break;
                    case 3:
                        this.style.cursor='w-resize';
                        break;
                    case 4:
                        this.style.cursor='e-resize';
                        break;
                    case 5:
                        this.style.cursor='sw-resize';
                        break;
                    case 6:
                        this.style.cursor='s-resize';
                        break;
                    case 7:
                        this.style.cursor='se-resize';
                        break;
                }
                return;
            }
            
        }
        // not over a selection box, return to normal
        isResizeDrag = false;
        expectResize = -1;
        this.style.cursor='auto';
    }
    
}

// Happens when the mouse is clicked in the canvas
function myDown(e){
    getMouse(e);
    
    //we are over a selection box
    if (expectResize !== -1) {
        isResizeDrag = true;
        return;
    }
    
    clear(gctx);
    var l = boxes.length;
    for (var i = l-1; i >= 0; i--) {
        // draw shape onto ghost context
        boxes[i].draw(gctx, 'black');
        
        // get image data at the mouse x,y pixel
        var imageData = gctx.getImageData(mx, my, 1, 1);
        var index = (mx + my * imageData.width) * 4;
        
        // if the mouse pixel exists, select and break
        if (imageData.data[3] > 0) {
            mySel = boxes[i];
            offsetx = mx - mySel.x;
            offsety = my - mySel.y;
            mySel.x = mx - offsetx;
            mySel.y = my - offsety;
            isDrag = true;
            
            invalidate();
            clear(gctx);
            return;
        }
        
    }
    // havent returned means we have selected nothing
    mySel = null;
    // clear the ghost canvas for next time
    clear(gctx);
    // invalidate because we might need the selection border to disappear
    invalidate();
}

function myUp(){
    isDrag = false;
    isResizeDrag = false;
    expectResize = -1;
}

// adds a new node
function myDblClick(e) {
    getMouse(e);
    // for this method width and height determine the starting X and Y, too.
    // so I left them as vars in case someone wanted to make them args for something and copy this code
    var width = 20;
    var height = 20;
    //addRect(mx - (width / 2), my - (height / 2), width, height, 'rgba(0,205,0,0.7)', '');
}


function invalidate() {
    canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e) {
            var element = canvas, offsetX = 0, offsetY = 0;

            if (element.offsetParent) {
                do {
                    offsetX += element.offsetLeft;
                    offsetY += element.offsetTop;
                } while ((element = element.offsetParent));
            }

            // Add padding and border style widths to offset
            offsetX += stylePaddingLeft;
            offsetY += stylePaddingTop;

            offsetX += styleBorderLeft;
            offsetY += styleBorderTop;

            mx = e.pageX - offsetX;
            my = e.pageY - offsetY
}

function handleFiles(files){

    imagefile = this.files[0];
    if (!imagefile.type.match(/image.*/)) {
        window.alert("This file is not an image.");
        return;
    }
    image = document.createElement("img");
    image.src = window.URL.createObjectURL(imagefile);
    image.onload = function(e) {  
        window.URL.revokeObjectURL(this.src);
        initCanvas();
    }
    
}

function calc_scale(max_x, max_y, img){
    var width = img.width;
    var height = img.height;

    var scale_f = 1;
    
    if (width > height || max_y === 0) {
        if (width > max_x) {
            scale_f = max_x / width
        }
    } else {
        if (height > max_y || max_x === 0) {
            scale_f = max_y / height;
        }
    }

    return scale_f;
}

function upload(){

    // Resize image    
    var submit_scale = calc_scale(1262, 1772, image);

    var tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = image.width*submit_scale;
    tmpCanvas.height = image.height*submit_scale;

    var ctx = tmpCanvas.getContext("2d");
    ctx.drawImage(image, 0, 0, tmpCanvas.width, tmpCanvas.height);

    var img = document.createElement("img");
    img.src = tmpCanvas.toDataURL("image/png");

    var url = '/process'
    var dataurl = tmpCanvas.toDataURL("image/png");
    var params = {"_csrf":csrf, "file": dataurl}

    $.post(url, params, function(json){
            features = json;
            for(var id in features){
                for(var idx in features[id]['bounding_box']){
                    features[id]['bounding_box'][idx] /=submit_scale/scale;
                }
            }
            initVerify();
        },
        'json'
    );

}
