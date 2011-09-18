// Chrome hack
window.URL = window.URL || window.webkitURL;

// File and image representation of the document
var imageFile;
var imageCanvas;
var image;
var scale = 1;
var submit_scale = 1;

// Faetures found
var features;

// New, holds the 8 tiny boxes that will be our selection handles
// the selection handles will be in this order:
// 0    1    2
// 3         4
// 5    6    7
var selectionHandles = [];

// Hold canvas formativeation
var canvas;
var ctx;

// Use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx;

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
var mySelId = -1;
var selArrow = false;
var cursorPos = 0;
var cursorAlpha = 1.0;
var cursorOn = true;
var CURSOR_INTERVAL = 500;

// The selection color and width. Right now we have a red selection with a
// small width
var mySelColor = '#CC0000';
var mySelWidth = 2;
var mySelBoxColor = 'darkred'; // New for selection boxes
var mySelBoxSize = 6;



// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

function SelectorRect(){
    this.x;
    this.y;
    this.w;
    this.h;
}

function Target(x, y){
    this.type = 'TARGET'
    this.x = x;
    this.y = y;
    this.w = 1;
    this.h = 1;
}

function initCanvas(){
    $("#process").show();
    $("#process").click(upload);
    $("#original").show();
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
    $("#process").hide();
    $("#original").show();
    $("#original").click(invalidate);
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
    setInterval(drawCursor, CURSOR_INTERVAL);

    // set events
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.ondblclick = myDblClick;
    canvas.onmousemove = myMove;

    $(document).bind("keypress", myKey);
    $(document).bind("keydown", myNonTextKey);
    //document.textinput = ;
    
    // set up the selection handle boxes
    for (var i = 0; i < 8; i ++) {
        var rect = new SelectorRect;
        selectionHandles.push(rect);
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
        if($("#showoriginal").is(':checked'))
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // Draw all features
        for (idx in features) {
            features[idx].draw(ctx);
        }

        canvasValid = true;
    }
}

function myNonTextKey(e){
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;

    
    if(mySel.type !== null &&
            (mySel.type === 'TEXT' || mySel.type === 'LABEL')){
        switch(code){
            case 8: // Backspace
                if(mySel.val.length > 0 && cursorPos > 0){
                    mySel.val = mySel.val.substring(0,cursorPos-1) +
                        mySel.val.substring(cursorPos,mySel.val.length);
                    cursorPos--;
                }
                break;
            case 37: // Left
                cursorPos = cursorPos > 0 ? cursorPos-1 : 0;
                break;
            case 39: //right
                cursorPos = cursorPos < mySel.val.length ? cursorPos+1 : mySel.val.length;
                break;
            case 46: // Delete
                if(mySel.val.length > 0 && cursorPos < mySel.val.length){
                    mySel.val = mySel.val.substring(0,cursorPos) +
                        mySel.val.substring(cursorPos+1,mySel.val.length);
                }
                break;
        }
    }
    // Delete key
    else if (code == 46){
        if(mySel !== null){
            delete features[mySelId];
            mySel = null;
            mySelId = -1;
        }
    }

    invalidate();
}

function myKey(e){
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;  

    
    if(mySel.type !== null &&
            (mySel.type === 'TEXT' || mySel.type === 'LABEL')){

        cursorPos++;
        // Expand box if too small
        var newText = mySel.val+String.fromCharCode(code);
        ctx.font = "bold " + mySel.h + "px sans-serif";
        var newWidth = ctx.measureText(newText).width;
        if(newWidth > mySel.w){
            mySel.w = newWidth;
        }
        mySel.val = newText;
        

        // Disable spacebar
        if(e.keyCode==32){
            e.preventDefault();
            return false;
        }
    }
    
    invalidate();
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
    if (isDrag) {
        getMouse(e);
         if(!selArrow){
            mySel.x = mx - offsetx;
            mySel.y = my - offsety;
        }
        else{
            mySel.target.x = mx;
            mySel.target.y = my;
        }
        
        // something is changing position so we better invalidate the canvas!
        invalidate();
    } else if (isResizeDrag && !selArrow) {
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
    for (idx in features) {
        // draw shape onto ghost context
        var box_color = 'rgba(50,50,50,1)';
        var arrow_color = 'rgba(200,200,200,1)';
        features[idx].draw(gctx, box_color, arrow_color);
        
        // get image data at the mouse x,y pixel
        var imageData = gctx.getImageData(mx, my, 1, 1);
        var index = (mx + my * imageData.width) * 4;
        
        // if the mouse pixel exists, select and break
        var selection = imageData.data[0];
        if (selection === 50 || selection === 200 ) {
            if((features[idx].type === 'TEXT' || features[idx].type === 'LABEL') &&
                mySel !== features[idx]    
            )
                cursorPos = features[idx].val.length;

            mySel = features[idx];
            mySelId = idx;
            offsetx = mx - mySel.x;
            offsety = my - mySel.y;
            mySel.x = mx - offsetx;
            mySel.y = my - offsety;
            isDrag = true;
            
            if(selection===200){
                selArrow = true;
                // Unlink
                if(!(mySel.target instanceof Object)){
                    features[mySel.target].linked = -1;
                }
                mySel.target = new Target(mx,my);
            }
            else{
                selArrow = false;
            }

            invalidate();
            clear(gctx);
            return;
        }
        
    }
    // havent returned means we have selected nothing
    mySel = null;
    mySelId = -1;
    // clear the ghost canvas for next time
    clear(gctx);
    // invalidate because we might need the selection border to disappear
    invalidate();
}

function myUp(e){
    isDrag = false;
    isResizeDrag = false;
    expectResize = -1;
    // Is the arrow inside a box?
    if(selArrow){
        getMouse(e);
        for (idx in features) {
            // draw shape onto ghost context
            var box_color = 'rgba(50,50,50,1)';
            var arrow_color = 'rgba(200,200,200,1)';
            features[idx].draw(gctx, box_color, arrow_color);
            
            // get image data at the mouse x,y pixel
            var imageData = gctx.getImageData(mx, my, 1, 1);
            var index = (mx + my * imageData.width) * 4;
            
            // if the mouse pixel exists, select and break
            var selection = imageData.data[0];
            if (selection === 50) {
                var found = features[idx];
                if((found.type == 'CHECKBOX' || found.type == 'TEXTBOX') &&
                        found.linked === -1){
                    // Link
                    found.linked = mySelId;
                    mySel.target = idx;
                }
                // Moves it off invalid box
                else{
                    mySel.target = new Target(mySel.x + mySel.w+20,
                            mySel.y + mySel.h/2);
                }

                invalidate();
                clear(gctx);
                return;
            }
            
        }
    }
    selArrow = false;

}

// adds a new node
function myDblClick(e) {
    getMouse(e);
    
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
        features = {};
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

var fakeit = true;

function initFeatures(json){
        features = json;
        for(var id in features){
            features[id].x /=submit_scale/scale;
            features[id].y /=submit_scale/scale;
            features[id].w /=submit_scale/scale;
            features[id].h /=submit_scale/scale;
            features[id].draw = draw;
            features[id].drawTextbox = drawTextbox;
            features[id].drawCheckbox = drawCheckbox;
            features[id].drawText = drawText;
            features[id].drawLabel = drawLabel;

            // Trim bounding boxes
            if(features[id].type === 'TEXT' || features[id].type === 'LABEL'){
                ctx.font = "bold " + features[id].h + "px sans-serif";
                var text_width = ctx.measureText(features[id].val).width;
                if(text_width < features[id].w){
                    features[id].w = text_width;
                }
            }

        }
        initVerify();
}

function upload(){

    // Resize image    
    submit_scale = calc_scale(1262, 1772, image);

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

    if(fakeit){
        initFeatures(testdata);
        return;
    }

    $.post(url, params, initFeatures, 'json');
}
