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

// Checkbox refences
//var showoriginal = $("#showoriginal");
//var showresults = $("#showresults");

var isDrag = false;
var isSelectionDrag = false;
var isResizeDrag = false;
var expectResize = -1;  // New, will save the # of the selection handle if the
                        // mouse is over one.
var mx, my; // mouse coordinates

var selX, selY; // Selection start

mainDrawOn = false;
mainDrawInit = false;

 // when set to true, the canvas will redraw everything
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned
// into an array
var lastSel;
var lastSelId = -1;
var mySel = [];
var mySelId = [];
var selArrow = false;
var cursorPos = 0;
var cursorAlpha = 1.0;
var cursorOn = true;
var CURSOR_INTERVAL = 500;
var ctrlDown = false;

// The selection color and width. Right now we have a red selection with a
// small width
var mySelColor = '#CC0000';
var mySelWidth = 2;
var mySelBoxColor = 'darkred'; // New for selection boxes
var mySelBoxSize = 6;


// Context menu stuff
var contextmenuisinit = false;
var contextmenu;
var contextMenuVisible = false;
var cx, cy; // Context menu source
var next_id = 10000; // id's for new features

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

// Small rectangles for selectoion resize
function SelectorRect(){
    this.x;
    this.y;
    this.w;
    this.h;
}


//wipes the canvas context
function clear(c) {
    c.clearRect(0, 0, WIDTH, HEIGHT);
}

// Main draw loop.
// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function mainDraw() {
    if (canvasValid == false && mainDrawOn === true) {
        clear(ctx);

        // Draw background image
        if( $("#showoriginal").is(':checked') ){
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
        
        if( $("#showresults").is(':checked')){

            // Draw all features
            for (idx in features) {
                if(!features.hasOwnProperty(idx)){
                    break;
                }
                features[idx].draw(ctx);
            }
        }

        // Draw selection
        if(isSelectionDrag){
            context.fillStyle = 'rgba(212,30,75,0.3)';
            context.fillRect(selX,selY,mx-selX,my-selY);
        }
        canvasValid = true;
    }
}

function myNonTextKey(e){
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;

    
    if(mySel.length !== 0 &&
            (mySel[0].type === 'TEXT' || mySel[0].type === 'LABEL')){
        switch(code){
            case 8: // Backspace
                if(mySel[0].val.length > 0 && cursorPos > 0){
                    mySel[0].val = mySel[0].val.substring(0,cursorPos-1) +
                        mySel[0].val.substring(cursorPos,mySel[0].val.length);
                    cursorPos--;
                }
                break;
            case 37: // Left
                cursorPos = cursorPos > 0 ? cursorPos-1 : 0;
                break;
            case 39: //right
                cursorPos = cursorPos < mySel[0].val.length ? cursorPos+1 : mySel[0].val.length;
                break;
            case 46: // Delete
                if(mySel[0].val.length > 0 && cursorPos < mySel[0].val.length){
                    mySel[0].val = mySel[0].val.substring(0,cursorPos) +
                        mySel[0].val.substring(cursorPos+1,mySel[0].val.length);
                }
                else {
                    deleteSelected();
                }
                break;
        }
    }
    // Delete key
    else if (code === 46){
        deleteSelected();
    }
    else if(code === 17){ // CTRL
        ctrlDown = true;
    }

    // Select all
    if(e.ctrlKey && code === 65){
        clearSelection();
        for(idx in features){
            if(features.hasOwnProperty(idx) && features[idx] != undefined){
                mySel.push(features[idx]);
                mySelId.push(idx);
            }
        }
        invalidate();
        return false;
    }

    invalidate();
}

function deleteSelected(){

    mySelId.forEach(function(fid, idx, array){
        var feature = features[fid];
        if((feature.type === 'TEXTBOX' || feature.type === 'CHECKBOX') &&
                feature.linked != -1){
            var lnk = features[feature.linked];
            features[feature.linked].target = {'x':lnk.x+lnk.w+20,
                    'y':lnk.y+lnk.h, 'w':1, 'h':1};

        }
        else if(
                feature.type === 'LABEL' &&
                !(feature.target instanceof Object) &&
                features[feature.target] !== undefined              
            ){
            features[feature.target].linked = -1;
        }

        delete features[fid];
        
    });
    clearSelection();
    showContextMenu(false); 
    invalidate();
}

function myKey(e){
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;  


    if(mySel.length !== 0 &&
            (mySel[0].type === 'TEXT' || mySel[0].type === 'LABEL')){

        // Expand box if too small
        var newText = mySel[0].val.substring(0,cursorPos) + 
                String.fromCharCode(code) +
                mySel[0].val.substring(cursorPos,mySel[0].val.length);

        ctx.font = "bold " + mySel[0].h + "px sans-serif";
        var newWidth = ctx.measureText(newText).width;
        if(newWidth > mySel[0].w){
            mySel[0].w = newWidth;
        }
        mySel[0].val = newText;
        
        cursorPos++;

        // Disable default spacebar
        if(e.keyCode==32){
            e.preventDefault();
            return false;
        }
        // Keep cursor visible
        cursorOn = true;
    }
    showContextMenu(false);
    invalidate();
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
    if (isDrag) {
        getMouse(e);
         if(!selArrow){
            // Calculate offser relative to the last
            // Selected item
            var abs_x = mx - offsetx;
            var abs_y = my - offsety;

            var rel_x = abs_x - lastSel.x;
            var rel_y = abs_y - lastSel.y;
            
            mySel.forEach(function(val, idx, array){
                val.x += rel_x;
                val.y += rel_y;
            })
        }
        else{
            lastSel.target.x = mx;
            lastSel.target.y = my;
        }
        
        // something is changing position so we better invalidate the canvas!
        invalidate();
    // Resize the selection
    } else if (isResizeDrag && !selArrow) {
        // time ro resize!
        var oldx = lastSel.x;
        var oldy = lastSel.y;
        
        // 0    1    2
        // 3         4
        // 5    6    7
        switch (expectResize) {
            case 0:
                lastSel.x = mx;
                lastSel.y = my;
                lastSel.w += oldx - mx;
                lastSel.h += oldy - my;
                break;
            case 1:
                lastSel.y = my;
                lastSel.h += oldy - my;
                break;
            case 2:
                lastSel.y = my;
                lastSel.w = mx - oldx;
                lastSel.h += oldy - my;
                break;
            case 3:
                lastSel.x = mx;
                lastSel.w += oldx - mx;
                break;
            case 4:
                lastSel.w = mx - oldx;
                break;
            case 5:
                lastSel.x = mx;
                lastSel.w += oldx - mx;
                lastSel.h = my - oldy;
                break;
            case 6:
                lastSel.h = my - oldy;
                break;
            case 7:
                lastSel.w = mx - oldx;
                lastSel.h = my - oldy;
                break;
        }
        
        invalidate();
    }
    else if(isSelectionDrag){
        invalidate();
    }
    
    getMouse(e);
    // if there's a selection see if we grabbed one of the selection handles
    if (mySel.length !== 0 && !isResizeDrag && !isSelectionDrag) {
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
        if(!features.hasOwnProperty(idx)){
                break;
        }
        // draw shape onto ghost context
        var box_color = 'rgba(50,50,50,1)';
        var arrow_color = 'rgba(200,200,200,1)';
        features[idx].draw(gctx, box_color, arrow_color);
        
        // get image data at the mouse x,y pixel
        var imageData = gctx.getImageData(mx, my, 1, 1);
        var index = (mx + my * imageData.width) * 4;
        
        // if the mouse pixel exists, select and break
        var val = imageData.data[0];
        if (val === 50 || val === 200 ) {

            var selection = features[idx];
            lastSel = features[idx];
            lastSelId = idx;

            // Check if the item is already selected selected
            var alreadySelected = false;
            for(var i = 0; i < mySel.length; i++){
                if(mySel[i] === features[idx]){
                    alreadySelected = true;
                }
            }

            // Set cursor position if alreadySelected
            if((features[idx].type === 'TEXT' || features[idx].type === 'LABEL') &&
                alreadySelected 
            ){
                cursorPos = features[idx].val.length;
            }


            // Dont clear previous selection if ctrl is down
            if(!ctrlDown && !alreadySelected){
                mySel = [];
                mySelId = [];
            }

            if(!alreadySelected){
                mySel.push(features[idx]);
                mySelId.push(idx);
            }

            
            offsetx = mx - selection.x;
            offsety = my - selection.y;
            selection.x = mx - offsetx;
            selection.y = my - offsety;

            // Only drag on left click
            if(e.button != 2)
                isDrag = true;
            
            // If selected an arrow
            if(val===200){
                selArrow = true;
                // Unlink
                if(!(selection.target instanceof Object)){
                    features[selection.target].linked = -1;
                }
                selection.target = {'x':mx, 'y':my, 'w':1, 'h':1};
            }
            else{
                selArrow = false;
            }


            if(e.button === 2){
                showContextMenu(true);
                $('#contextmenu').offset({top:e.pageY, left:e.pageX});
            }

            invalidate();
            clear(gctx);
            return;
        }
    }
    // havent returned means we have selected nothing
    
    if(!ctrlDown){
        clearSelection();
    }

    if(e.button === 2){
        showContextMenu(true);
        $('#contextmenu').offset({top:e.pageY, left:e.pageX});
    }
    else{
        isSelectionDrag = true;
        selX = mx;
        selY = my;
    }
    // clear the ghost canvas for next time
    clear(gctx);
    // invalidate because we might need the selection border to disappear
    invalidate();
}

function clearSelection(){
    mySel = [];
    mySelId = [];
    myLastSel = null;
    myLastSelId = -1;
}

function myUp(e){
    isDrag = false;
    isResizeDrag = false;
    expectResize = -1;
    // Is the arrow inside a box?
    if(selArrow){
        getMouse(e);
        for (idx in features) {
            if(!features.hasOwnProperty(idx)){
                break;
            }
            // draw shape onto ghost context
            var box_color = 'rgba(50,50,50,1)';
            var arrow_color = 'rgba(200,200,200,1)';
            features[idx].draw(gctx, box_color, arrow_color);
            
            // get image data at the mouse x,y pixel
            var imageData = gctx.getImageData(mx, my, 1, 1);
            var index = (mx + my * imageData.width) * 4;
            
            // if the mouse pixel indicates a selection
            // try to bind arrow to selection select and break
            var pxVal = imageData.data[0];
            if (pxVal === 50) {
                var found = features[idx];
                if((found.type == 'CHECKBOX' || found.type == 'TEXTBOX') &&
                        found.linked === -1){
                    // Link
                    found.linked = lastSelId;
                    lastSel.target = idx;
                }
                // Moves it off invalid box
                else{
                    lastSel.target = {'x':lastSel.x + lastSel.w+20,
                            'y':lastSel.y + lastSel.h, 'w':1, 'h':1};
                }

                invalidate();
                clear(gctx);
                return;
            }
            
        }
    }
    selArrow = false;
    showContextMenu(contextMenuVisible);
    if(isSelectionDrag){
        clearSelection();
        for(idx in features){
            // Find center
            var f = features[idx];
            var x = f.x+f.w/2;
            var y = f.y+f.h/2;

            // determine bounds
            var min_x = selX < mx ? selX : mx;
            var max_x = selX > mx ? selX : mx;
            var min_y = selY < my ? selY : my;
            var max_y = selY > my ? selY : my;

            // If selection over center add it
            if(x > min_x && x < max_x && y > min_y && y < max_y){
                mySel.push(features[idx]);
                mySelId.push(idx);
            }
        }
    }
    isSelectionDrag = false;
    invalidate();
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

function newFeature(type, x, h, w, h){
    var x = x || mx;
    var y = y || my;
    var w = w || 25;
    var h = h || 25;

    var idx = next_id++;
    features[idx] = {
            'x' : mx,
            'y' : my,
            'w' : w,
            'h' : h,
            'draw' : draw,
            'drawTextbox' : drawTextbox,
            'drawCheckbox' : drawCheckbox,
            'drawText' : drawText,
            'drawLabel' : drawLabel,
            'type' : type,
    }
    if(type === 'LABEL'){
        features[idx].w = 80;
        features[idx].target = {'x':x+80+20, 'y':y+h, 'w':1, 'h':1};
        features[idx].val = 'label';
    }
    else if(type === 'TEXT'){
        features[idx].val = 'text';
        features[idx].w = 80;
    }
    else if(type === 'TEXTBOX'){
        features[idx].w = 80;
        features[idx].linked = -1;
    }
    else if(type === 'CHECKBOX'){
        features[idx].linked = -1;
    }
    invalidate();
    return features[idx];
}

function initContextMenu(){

    if(contextmenuisinit){
        return;
    }
    contextmenuisinit = true;

    window.oncontextmenu = function(){return false;};
    contextmenu.onmouseover = function(){contextMenuVisible=true}
    contextmenu.onmouseover = function(){contextMenuVisible=false}
    $('#delete').click(function(){
        deleteSelected();
        return false;
    });

    $('#newlabel').click(function(e){
        getMouse(e);
        newFeature('LABEL', cx, cy);
        showContextMenu(false);
        return false;
    });
    $('#newtextbox').click(function(e){
        getMouse(e);
        newFeature('TEXTBOX', cx, cy);
        showContextMenu(false);
        return false;
    });
    $('#newcheckbox').click(function(e){
        getMouse(e);
        newFeature('CHECKBOX', cx, cy);
        showContextMenu(false);
        return false;
    });
    $('#newtext').click(function(e){
        getMouse(e);
        newFeature('TEXT', cx, cy);
        showContextMenu(false);
        return false;
    });

    $('#convertlabel').click(function(){
        mySel[0].type = "LABEL";
        mySel[0].target = {'x':mySel[0].x+mySel[0].w+20, 'y':mySel[0].y+mySel[0].h, 'w':1, 'h':1}
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#converttext').click(function(){
        mySel[0].type = "TEXT";
        if(!(mySel[0].target instanceof Object))
            features[lastSel.target].linked = -1;
        mySel[0].target = undefined;
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#converttextbox').click(function(){
        mySel[0].type = "TEXTBOX";
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#convertcheckbox').click(function(){
        mySel[0].type = "CHECKBOX";
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#clone').click(function(){
        mySel[0].type = "CHECKBOX";
        showContextMenu(false);
        invalidate();
        return false;
    });
}

function showContextMenu(show){
    if(!show){
        $('#contextmenu').hide();
        return
    }
    
    if(!mainDrawOn){
        return;
    }

    // set seed point
    if(!contextMenuVisible){
        cx = mx;
        cy = cy;
    }

    var sel = lastSel || {'type':'NONE'};
    if(mySel.length >1)
        sel = "MULTI";
    
    $('#convertlabel').hide();
    $('#convertcheckbox').hide();
    $('#converttextbox').hide();
    $('#converttext').hide();

    $('#delete').show();
    
    $('#newlabel').hide();
    $('#newtextbox').hide();
    $('#newtext').hide();
    $('#newcheckbox').hide();

    $('.topSep').hide();
    $('.bottomSep').show();

    switch(sel.type){
        case 'NONE':
            $('#newlabel').show();
            $('#newtextbox').show();
            $('#newtext').show();
            $('#newcheckbox').show();
            $('#delete').hide();
            $('.bottomSep').hide();
            break;
        case 'TEXT':
            $('#convertlabel').show();
            break;
        case 'LABEL':
            $('#converttext').show();
            break;
        case 'CHECKBOX':
            $('#converttextbox').show();
            break;
        case 'TEXTBOX':
            $('#convertcheckbox').show();
            break;
        case 'MULTI':
            
            break;
    }

    $('#contextmenu').show();
}


function setEvents(on){
    if(on){
        canvas.onmousedown = myDown;
        canvas.onmouseup = myUp;
        canvas.ondblclick = myDblClick;
        canvas.onmousemove = myMove;
        document.onkeypress = myKey;
        document.onkeydown = myNonTextKey;
        document.onkeyup = function(){
            ctrlDown = false;
        }
        initContextMenu();
        
    }
    else{
        canvas.onmousedown = undefined;
        canvas.onmouseup =  undefined;
        canvas.ondblclick = undefined;
        canvas.onmousemove = undefined;
        document.onkeypress = myKey;
        document.onkeydown = myNonTextKey;
        window.oncontextmenu = undefined;
        contextmenu.onmouseover = undefined;
        contextmenu.onmouseover = undefined;
    }
}

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function initVerify() {
    $("#process").hide();
    $("#checkboxes").show();
    $("#checkboxes").click(invalidate);
    $("#showresults").click(function(){
        setEvents($("#showresults").is(':checked'));
    });

    contextmenu = document.createElement('contextmenu');
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
    if(mainDrawInit === false){
        setInterval(mainDraw, INTERVAL);
        setInterval(drawCursor, CURSOR_INTERVAL);
        mainDrawInit === true;
    }

    mainDrawOn = true;

    // set events
    setEvents($("#showresults").is(':checked'));

    // set up the selection handle boxes
    for (var i = 0; i < 8; i ++) {
        var rect = new SelectorRect;
        selectionHandles.push(rect);
    }

}

function initCanvas(){
    $("#process").show();
    $("#process").click(upload);
    $("#checkboxes").hide();
    scale = calc_scale(960, 0, image);
    HEIGHT = image.height*scale;
    WIDTH = image.width*scale;

    canvas = document.getElementById('canvas2');
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    clearSelection();
    mainDrawOn = false;
}


function initFeatures(json){
        features = json;
        for(var id in features){
            if(!features.hasOwnProperty(id)){
                break;
            }
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
