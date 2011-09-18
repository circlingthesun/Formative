// Chrome hack
window.URL = window.URL || window.webkitURL;

// File and image representation of the document
var imageFile;
var imageCanvas;
var image;
var scale = 1;

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
var mySelId = null;
var selArrow = false;

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


// mainDraw() will call this with the normal canvas
// myDown will call this with the ghost canvas with 'black'
var draw = function(context, boxColor, arrowColor) {
    if (context === gctx) {
        // black for the ghost canvas
        context.fillStyle = boxColor;
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
    if (mySel === this) {
        context.strokeStyle = mySelColor;
        context.lineWidth = mySelWidth;
        context.strokeRect(this.x,this.y,this.w,this.h);
                
        var half = mySelBoxSize / 2;
                
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
    if(context === ctx){
        context.fillStyle = 'rgba(0,0,0,1.0)';
        context.textBaseline = 'bottom';
        context.font = "bold 11px sans-serif";
        context.fillText(this.val, this.x, this.y+this.h);
    }
    // Draw arrow arrow
    if(this.type === 'LABEL'){
    
        from = this;
        var fromX = this.x;
        var fromY = this.y;
        var fromW = this.w;
        var fromH = this.h;

        // Del with deleted targets
        var to;
        if(this.target instanceof Object){
            to = this.target;
        }
        else if(features[this.target] === undefined){
            this.target = new Target(this.x+this.w+20, this.y+this.h/2);
            to = this.target;
        }
        else{
            to = features[this.target];
        }

        var toX = to.x;
        var toY = to.y;
        var toW = to.w;
        var toH = to.h;
        
        // Only draw the end of the arrow for the ghost canvas
        if(context === gctx){
            context.fillStyle = arrowColor;
            context.strokeStyle = arrowColor;
        }
        else{
            context.strokeStyle = 'rgba(255,50,50,1.0)';
            context.fillStyle = 'rgba(255,50,50,1.0)';
        }

        // Where is the target relative to the label?
        // If right
        if(to.x > from.x + from.w){
           toY = to.y + to.h/2;
           fromY = from.y+from.h/2;
           fromX = from.x+from.w;
        }
        // If left
        else if(to.x + to.w < from.x){
            toY = to.y + to.h/2;
            toX = to.x + to.w;
            fromY = from.y+from.h/2;
            //fromX = from.x;
        }
        // If horisontal middle
        else{
            toX = to.x + to.w/2;
            // If ontop
            if(to.y+to.h < from.y){
                fromX = from.x + from.w/2;
                toY = to.y + to.h;
            }
            // If bottom
            else if(to.y > from.y+from.h){
                fromX = from.x+from.w/2;
                fromY = from.y+from.h;
            }
            else{
                fromX = from.x+from.w/2;
                toX = to.x + to.w;
            }
        }

        context.lineWidth   = 2;
        var headlen = 20;   // length of head in pixels
        var angle = Math.atan2(toY-fromY,toX-fromX);


        // Line
        if(context === ctx){
            context.beginPath();
            context.moveTo(fromX, fromY);
            context.lineTo(toX, toY);
            context.closePath();
            context.stroke();
        }

        //Head
        context.beginPath();
        context.moveTo(toX, toY);
        context.lineTo(toX-headlen*Math.cos(angle-Math.PI/6),
                toY-headlen*Math.sin(angle-Math.PI/6));
        context.lineTo(toX-headlen*Math.cos(angle+Math.PI/6),
                toY-headlen*Math.sin(angle+Math.PI/6));
        context.lineTo(toX, toY);
        context.closePath();
        context.fill();
        
    }
    
} // end draw


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
    $("#process").hide();
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
    
    // set events
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.ondblclick = myDblClick;
    canvas.onmousemove = myMove;
    document.onkeyup = myKey;
    
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
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // Draw all features
        for (idx in features) {
            features[idx].draw(ctx);
        }
        
        canvasValid = true;
    }
}

function myKey(e){
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;  

    if (code == 46){
        delete features[mySelId];
    }
    mySel = null;
    mySelId = null;
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
            mySel = features[idx];
            mySelId = idx;
            offsetx = mx - mySel.x;
            offsety = my - mySel.y;
            mySel.x = mx - offsetx;
            mySel.y = my - offsety;
            isDrag = true;
            
            if(selection===200){
                selArrow = true;
                features[idx].target = -1;
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
    mySelId = null;
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
                if(found.type == 'CHECKBOX' || found.type == 'TEXTBOX'){
                    mySel.target = idx;
                }
                // Moves it off invalid box
                else{
                    mySel.target = -1;
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

function upload__(){

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
                features[id].x /=submit_scale/scale;
                features[id].y /=submit_scale/scale;
                features[id].w /=submit_scale/scale;
                features[id].h /=submit_scale/scale;
                features[id].draw = draw;
            }
            initVerify();
        },
        'json'
    );
}

function upload(){
    var submit_scale = calc_scale(1262, 1772, image);
    features = {"6": {"val": " id= 6, p=SIGNATURE OF PARENT af under 18) .", "h": 3, "w": 226, "y": 1616, "x": 960, "type": "TEXTBOX"}, "7": {"val": " id= 7, p=SIGNATURE OF ENTRANT: .", "h": 2, "w": 338, "y": 1615, "x": 305, "type": "TEXTBOX"}, "25": {"val": " id= 25, p=OFFICE PHONE NUMBER WITH CODE", "h": 35, "len": 20, "w": 745, "y": 928, "x": 431, "type": "TEXTBOX"}, "47": {"val": " id= 47, p=HOME PHONE NUMBER WITH CODE", "h": 39, "len": 20, "w": 747, "y": 875, "x": 431, "type": "TEXTBOX"}, "69": {"val": " id= 69, p=COUNTRY. IF OUTSIDE R.S.A.", "h": 3, "w": 343, "y": 855, "x": 338, "type": "TEXTBOX"}, "70": {"val": " id= 70, p=OCCUPATION", "h": 4, "w": 324, "y": 854, "x": 858, "type": "TEXTBOX"}, "72": {"val": " id= 72, p=2011 LICENCE NUMBER", "h": 5, "w": 333, "y": 809, "x": 847, "type": "TEXTBOX"}, "73": {"val": " id= 73, p=PROVINCE", "h": 6, "w": 431, "y": 807, "x": 170, "type": "TEXTBOX"}, "74": {"val": " id= 74, p=ATHLETIC CLUB NAME (IN FULL)", "h": 5, "w": 814, "y": 761, "x": 369, "type": "TEXTBOX"}, "77": {"val": " id= 77, p=ID NUMBER:", "h": 39, "len": 13, "w": 532, "y": 688, "x": 202, "type": "TEXTBOX"}, "91": {"val": " id= 91, p=", "h": 36, "len": 0, "w": 83, "y": 649, "x": 1040, "type": "TEXTBOX"}, "93": {"val": " id= 93, p=", "h": 36, "len": 0, "w": 84, "y": 649, "x": 743, "type": "TEXTBOX"}, "96": {"y": 653, "x": 508, "type": "CHECKBOX", "w": 32, "h": 26}, "97": {"y": 653, "x": 472, "type": "CHECKBOX", "w": 33, "h": 26}, "98": {"val": " id= 98, p=", "h": 38, "len": 6, "w": 235, "y": 647, "x": 65, "type": "TEXTBOX"}, "105": {"val": " id= 105, p=E-MAIL ADDRESS:", "h": 5, "w": 930, "y": 591, "x": 249, "type": "TEXTBOX"}, "106": {"val": " id= 106, p=", "h": 36, "len": 4, "w": 156, "y": 522, "x": 1026, "type": "TEXTBOX"}, "111": {"val": " id= 111, p=", "h": 38, "len": 24, "w": 926, "y": 518, "x": 65, "type": "TEXTBOX"}, "136": {"val": " id= 136, p=", "h": 36, "len": 24, "w": 926, "y": 475, "x": 65, "type": "TEXTBOX"}, "162": {"val": " id= 162, p=", "h": 36, "len": 24, "w": 926, "y": 430, "x": 65, "type": "TEXTBOX"}, "188": {"val": " id= 188, p=INITIALS I", "h": 36, "len": 4, "w": 156, "y": 357, "x": 1036, "type": "TEXTBOX"}, "193": {"val": " id= 193, p=FIRST NAME", "h": 35, "len": 20, "w": 745, "y": 355, "x": 194, "type": "TEXTBOX"}, "214": {"val": " id= 214, p=SURNAME", "h": 36, "len": 19, "w": 747, "y": 310, "x": 195, "type": "TEXTBOX"}, "237": {"val": " id= 237, p=Online Entries Q www.enteronline.co.za", "h": 43, "len": 7, "w": 266, "y": 229, "x": 917, "type": "TEXTBOX"}, "246": {"val": " id= 246, p=Please print clearly and complete ALL details.", "h": 5, "len": 0, "w": 47, "y": 219, "x": 302, "type": "TEXTBOX"}, "247": {"val": " id= 247, p=", "h": 36, "len": 0, "w": 192, "y": 159, "x": 956, "type": "TEXTBOX"}, "248": {"val": " id= 248, p=247:ORM", "h": 27, "len": 0, "w": 42, "y": 164, "x": 1101, "type": "TEXTBOX"}, "249": {"val": " id= 249, p=247RY", "h": 28, "len": 0, "w": 44, "y": 163, "x": 1054, "type": "TEXTBOX"}, "250": {"val": " id= 250, p=247EN", "h": 28, "len": 0, "w": 43, "y": 163, "x": 1008, "type": "TEXTBOX"}, "251": {"val": " id= 251, p=247", "h": 26, "len": 0, "w": 43, "y": 163, "x": 962, "type": "TEXTBOX"}, "263": {"val": " id= 263, p=\nCLUB CODE\nRACE NUMBERll", "h": 159, "len": 0, "w": 314, "y": 128, "x": 885, "type": "TEXTBOX"}, "267": {"val": "Account No: FNB (200109) 501 500 98439", "h": 21, "w": 445, "y": 1682, "x": 642, "type": "TEXT"}, "268": {"val": "All payments To be made ?o HEWAT ATHLETIC CLUB.", "h": 23, "w": 541, "y": 1680, "x": 65, "type": "TEXT"}, "269": {"val": "V", "h": 17, "w": 13, "y": 1643, "x": 846, "type": "TEXT"}, "270": {"val": "Faxed entry D", "h": 26, "w": 142, "y": 1641, "x": 659, "type": "TEXT"}, "271": {"val": "Payment by cheque lj", "h": 26, "w": 208, "y": 1638, "x": 68, "type": "TEXT"}, "272": {"val": "Direct Deposit D", "h": 28, "w": 165, "y": 1637, "x": 462, "type": "TEXT"}, "273": {"val": "Postal Order D", "h": 26, "w": 147, "y": 1635, "x": 293, "type": "TEXT"}, "274": {"val": "*Io", "h": 15, "w": 27, "y": 1621, "x": 854, "type": "TEXT"}, "275": {"val": "Yes", "h": 15, "w": 38, "y": 1621, "x": 766, "type": "TEXT"}, "276": {"target": 6, "val": "SIGNATURE OF PARENT af under 18) .", "h": 19, "w": 332, "y": 1603, "x": 633, "type": "LABEL"}, "277": {"target": 7, "val": "SIGNATURE OF ENTRANT: .", "h": 16, "w": 248, "y": 1601, "x": 61, "type": "LABEL"}, "278": {"val": "advertising promotion or other account of this event free of charge.", "h": 23, "w": 638, "y": 1539, "x": 68, "type": "TEXT"}, "279": {"val": "the Cape Town 21.1 km and its authorised agents to use my name. photographs. video-tapes. broadcasts. telecasts.", "h": 24, "w": 1122, "y": 1510, "x": 68, "type": "TEXT"}, "280": {"val": "not to exhibit or wear any advertising material or logos contrary to the rules of ASA or IAAF. Also. I grant permission to", "h": 25, "w": 1121, "y": 1482, "x": 68, "type": "TEXT"}, "281": {"val": "conditions and regulations which include the terms of payment of the entry fee and will comply with them. I undertake", "h": 24, "w": 1122, "y": 1453, "x": 68, "type": "TEXT"}, "282": {"val": "sufficiently trained to participate in this endurance event and assume all risks for such participation. I accept all rules.", "h": 25, "w": 1122, "y": 1424, "x": 68, "type": "TEXT"}, "283": {"val": "any of them and arising out of my participation in this event( including pre and post race activities. I am physically fit and", "h": 26, "w": 1122, "y": 1395, "x": 68, "type": "TEXT"}, "284": {"val": "any and all local authorities from all claims for injuries. damage or property loss I may suffer caused by the negligence of", "h": 26, "w": 1122, "y": 1366, "x": 68, "type": "TEXT"}, "285": {"val": "hereby release and discharge Cape Town 21.1 km. any and all sponsors. any and all volunteer groups. all medical personnel.", "h": 25, "w": 1121, "y": 1338, "x": 69, "type": "TEXT"}, "286": {"val": "In consideration of the acceptance of my entry. I for myself. my executors. heirs. administrators and assigns. do", "h": 26, "w": 1122, "y": 1309, "x": 68, "type": "TEXT"}, "287": {"val": "RELEASE AND WAIVER", "h": 16, "w": 216, "y": 1270, "x": 68, "type": "TEXT"}, "288": {"val": "TOTAL AMOUNT ENCLOSED", "h": 15, "w": 255, "y": 1214, "x": 63, "type": "TEXT"}, "289": {"val": "R.", "h": 14, "w": 20, "y": 1184, "x": 514, "type": "TEXT"}, "290": {"val": "lililiii", "h": 20, "w": 95, "y": 1178, "x": 611, "type": "TEXT"}, "291": {"val": "Other", "h": 11, "w": 51, "y": 1166, "x": 696, "type": "TEXT"}, "292": {"val": "VOLUNTARY DONATION TO CHARITY", "h": 15, "w": 342, "y": 1162, "x": 68, "type": "TEXT"}, "293": {"val": "R 25.00", "h": 15, "w": 77, "y": 1114, "x": 521, "type": "TEXT"}, "294": {"val": "TEMPORARY LICENCE FEE (Unlicensed Athletes)", "h": 19, "w": 419, "y": 1112, "x": 68, "type": "TEXT"}, "295": {"val": "FRIENDS OF LION\"S HEAD.", "h": 17, "w": 246, "y": 1097, "x": 870, "type": "TEXT"}, "296": {"val": "to the conservation group", "h": 20, "w": 218, "y": 1073, "x": 884, "type": "TEXT"}, "297": {"val": "* T-SHIRT see note", "h": 15, "w": 175, "y": 1063, "x": 67, "type": "TEXT"}, "298": {"val": "* R1 of each entry will be donated", "h": 20, "w": 287, "y": 1048, "x": 846, "type": "TEXT"}, "299": {"val": "R 50.00", "h": 17, "w": 78, "y": 1016, "x": 526, "type": "TEXT"}, "300": {"val": "ENTRY FEE = R50", "h": 16, "w": 168, "y": 1014, "x": 67, "type": "TEXT"}, "301": {"target": 25, "val": "OFFICE PHONE NUMBER WITH CODE", "h": 17, "w": 339, "y": 940, "x": 68, "type": "LABEL"}, "302": {"target": 47, "val": "HOME PHONE NUMBER WITH CODE", "h": 17, "w": 327, "y": 891, "x": 68, "type": "LABEL"}, "303": {"target": 70, "val": "OCCUPATION", "h": 16, "w": 127, "y": 846, "x": 728, "type": "LABEL"}, "304": {"target": 69, "val": "COUNTRY. IF OUTSIDE R.S.A.", "h": 17, "w": 268, "y": 843, "x": 68, "type": "LABEL"}, "305": {"target": 72, "val": "2011 LICENCE NUMBER", "h": 15, "w": 212, "y": 797, "x": 635, "type": "LABEL"}, "306": {"target": 73, "val": "PROVINCE", "h": 16, "w": 99, "y": 793, "x": 68, "type": "LABEL"}, "307": {"target": 74, "val": "ATHLETIC CLUB NAME (IN FULL)", "h": 19, "w": 298, "y": 744, "x": 68, "type": "LABEL"}, "308": {"target": 77, "val": "ID NUMBER:", "h": 16, "w": 115, "y": 703, "x": 68, "type": "LABEL"}, "309": {"val": "Year", "h": 15, "w": 47, "y": 633, "x": 243, "type": "TEXT"}, "310": {"val": "Dov", "h": 15, "w": 39, "y": 633, "x": 87, "type": "TEXT"}, "311": {"val": "Month", "h": 16, "w": 60, "y": 632, "x": 160, "type": "TEXT"}, "312": {"val": "AGE ON DAY OF RACE", "h": 17, "w": 199, "y": 628, "x": 413, "type": "TEXT"}, "313": {"val": "F (FEMALE)", "h": 19, "w": 133, "y": 626, "x": 1033, "type": "TEXT"}, "314": {"val": "M (MALE)", "h": 19, "w": 91, "y": 625, "x": 743, "type": "TEXT"}, "315": {"val": "DATE OF BIRTH", "h": 16, "w": 148, "y": 613, "x": 115, "type": "TEXT"}, "316": {"target": 105, "val": "E-MAIL ADDRESS:", "h": 15, "w": 168, "y": 580, "x": 66, "type": "LABEL"}, "317": {"val": "POSTAL CODE", "h": 16, "w": 132, "y": 502, "x": 1043, "type": "TEXT"}, "318": {"val": "POSTAL ADDRESS", "h": 16, "w": 168, "y": 404, "x": 68, "type": "TEXT"}, "319": {"target": 188, "val": "INITIALS I", "h": 15, "w": 97, "y": 369, "x": 944, "type": "LABEL"}, "320": {"target": 193, "val": "FIRST NAME", "h": 16, "w": 122, "y": 369, "x": 69, "type": "LABEL"}, "321": {"target": 214, "val": "SURNAME", "h": 16, "w": 97, "y": 322, "x": 69, "type": "LABEL"}, "322": {"target": 237, "val": "Online Entries Q www.enteronline.co.za", "h": 29, "w": 638, "y": 251, "x": 200, "type": "LABEL"}, "323": {"target": 246, "val": "Please print clearly and complete ALL details.", "h": 20, "w": 401, "y": 214, "x": 94, "type": "LABEL"}, "325": {"val": "-l", "h": 5, "w": 29, "y": 191, "x": 337, "type": "TEXT"}, "326": {"val": "T.", "h": 8, "w": 29, "y": 188, "x": 102, "type": "TEXT"}, "327": {"target": 250, "val": "EN", "h": 38, "w": 64, "y": 155, "x": 102, "type": "LABEL"}, "328": {"target": 263, "val": "ll", "h": 5, "w": 63, "y": 154, "x": 305, "type": "LABEL"}, "329": {"target": 248, "val": ":ORM", "h": 43, "w": 152, "y": 154, "x": 305, "type": "LABEL"}, "330": {"target": 249, "val": "RY", "h": 42, "w": 65, "y": 154, "x": 215, "type": "LABEL"}, "332": {"val": "FOR OFFICIAL USE ONLY", "h": 17, "w": 233, "y": 111, "x": 946, "type": "TEXT"}, "333": {"val": "PHoTocoPIEs ACCEPTABLE", "h": 19, "w": 294, "y": 58, "x": 904, "type": "TEXT"}, "334": {"val": "NO STAPLES ANYWHERE AT ALL PLEASE", "h": 19, "w": 427, "y": 57, "x": 61, "type": "TEXT"}}
    for(var id in features){
                features[id].x /=submit_scale/scale;
                features[id].y /=submit_scale/scale;
                features[id].w /=submit_scale/scale;
                features[id].h /=submit_scale/scale;
                features[id].draw = draw;
            }
    initVerify();
}
