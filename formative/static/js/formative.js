// Chrome hack
window.URL = window.URL || window.webkitURL;

// File and image representation of the document
var imageFile;
var imageCanvas;
var image;
var scale = 1;
var submit_scale = 1;

// Feature storage
var features;
var history = [];

// Hold canvas formativeation
var canvas;
var ctx;

// Use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx;

var WIDTH;
var HEIGHT;

var text_changed = false;

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
var cursorOnTime = 1;


// Context menu stuff
var contextmenuisinit = false;
var contextmenu;
var contextMenuVisible = false;
var cx, cy; // Context menu source
var next_id = 10000; // id's for new features

// save the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

/*
    Saves the current progran state
*/
function saveState() {
    history.push($.extend(true, {}, features));
    if(history.length > MAX_HISTORY) {
        history.splice(1,1);
    }
    var histob = {};
    for(id in features) {
        if(features.hasOwnProperty(id)) {
            histob[id] = new Feature(features[id]);
        }
    }
    history.push(histob);
    $('#undo').removeAttr("disabled");
}

/*
    Restores the features object to the previous state
    TODO: A flash or some feedback would be nice
 */
function restoreState() {
    if(history.length > 1) {
        features = history.splice(history.length-1,1)[0];
    }
    else if(history.length === 1) {
        $('#undo').attr("disabled", "disabled");
        features = history.splice(history.length-1,1)[0];
        //saveState();
    }
    text_changed = false;
    invalidate();
}

/*
    Clears the canvas
*/
function clear(c) {
    c.clearRect(0, 0, WIDTH, HEIGHT);
}

/*
    Main draw loop runs every INTERVAL miliseconds
    Only draws when invalidated
*/
function mainDraw() {
    if (canvasValid === false && mainDrawOn === true) {
        clear(ctx);

        // Draw background image
        if( $("#showoriginal").is(':checked') ) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
        
        if( $("#showresults").is(':checked')) {

            // Draw all features
            for (idx in features) {
                if(!features.hasOwnProperty(idx)) {
                    break;
                }
                features[idx].draw(ctx);
            }
        }

        // Draw selection
        if(isSelectionDrag) {
            context.strokeStyle = DRAG_SELECT_STROKE_COLOUR;
            context.fillStyle = DRAG_SELECT_COLOUR;//'rgba(212,30,75,0.3)';
            context.fillRect(selX,selY,mx-selX,my-selY);
            context.strokeRect(selX,selY,mx-selX,my-selY);
        }
        canvasValid = true;
    }
}

function myNonTextKey(e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;

    
    if(mySel.length !== 0 && lastSel !== null &&
            (lastSel.type === 'TEXT' || lastSel.type === 'LABEL')) {
        switch(code) {
            case 8: // Backspace
                if(lastSel.val.length > 0 && cursorPos > 0) {
                    lastSel.val = lastSel.val.substring(0,cursorPos-1) +
                        lastSel.val.substring(cursorPos,lastSel.val.length);
                    cursorPos--;
                    text_changed = true;
                }
                break;
            case 37: // Left
                cursorPos = cursorPos > 0 ? cursorPos-1 : 0;
                break;
            case 39: //right
                cursorPos = cursorPos < lastSel.val.length ?
                        cursorPos+1 : lastSel.val.length;
                break;
            case 46: // Delete
                if(lastSel.val.length > 0 && cursorPos < lastSel.val.length) {
                    lastSel.val = lastSel.val.substring(0,cursorPos) +
                        lastSel.val.substring(cursorPos+1,lastSel.val.length);
                    text_changed = true;
                }
                else {
                    deleteSelected();
                }
                break;
        }
        cursorOnTime = 15;
    }
    // Delete key
    else if (code === 46) {
        deleteSelected();
    }

    // Select all
    if(e.ctrlKey && code === 65) {
        clearSelection();
        for(idx in features) {
            if(features.hasOwnProperty(idx) && features[idx] != undefined) {
                mySel.push(features[idx]);
                mySelId.push(idx);
            }
        }
        invalidate();
        return false;
    }

    // CTRL - Z undo
    if(e.ctrlKey && code === 90) {
        restoreState();
        return false;
    }

    invalidate();
}

function deleteSelected() {
    saveState();
    mySelId.forEach(function(fid, idx, array) {
        var feature = features[fid];
        if((feature.type === 'TEXTBOX' || feature.type === 'CHECKBOX') &&
                feature.linked != -1) {
            var lnk = features[feature.linked];
            features[feature.linked].target = {'x':lnk.x+lnk.w+20,
                    'y':lnk.y+lnk.h, 'w':1, 'h':1};

        }
        else if(
                feature.type === 'LABEL' &&
                !(feature.target instanceof Object) &&
                features[feature.target] !== undefined              
            ) {
            features[feature.target].linked = -1;
        }

        delete features[fid];
        
    });
    clearSelection();
    showContextMenu(false); 
    invalidate();
}

function myKey(e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;  


    if(mySel.length !== 0 &&
            (lastSel.type === 'TEXT' || lastSel.type === 'LABEL')) {

        // Expand box if too small
        var newText = lastSel.val.substring(0,cursorPos) + 
                String.fromCharCode(code) +
                lastSel.val.substring(cursorPos,lastSel.val.length);

        ctx.font = "bold " + lastSel.h + "px sans-serif";
        var newWidth = ctx.measureText(newText).width;
        if(newWidth > lastSel.w) {
            lastSel.w = newWidth;
        }
        lastSel.val = newText;
        
        cursorPos++;
        text_changed = true;
        // Disable default spacebar
        if(e.keyCode==32) {
            e.preventDefault();
            return false;
        }
    }

    showContextMenu(false);
    invalidate();
}

// Happens when the mouse is moving inside the canvas
function myMove(e) {
    if (isDrag) {
        getMouse(e);
         if(!selArrow) {
            // Calculate offser relative to the last
            // Selected item
            var abs_x = mx - offsetx;
            var abs_y = my - offsety;

            var rel_x = abs_x - lastSel.x;
            var rel_y = abs_y - lastSel.y;
            
            mySel.forEach(function(val, idx, array) {
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
    else if(isSelectionDrag) {
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
function myDown(e) {
    getMouse(e);
    

    //we are over a selection box
    if (expectResize !== -1) {
        isResizeDrag = true;
        return;
    }

    clear(gctx);
    for (idx in features) {
        if(!features.hasOwnProperty(idx)) {
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
            for(var i = 0; i < mySel.length; i++) {
                if(mySel[i] === features[idx]) {
                    alreadySelected = true;
                }
            }

            // Set cursor position
            if((features[idx].type === 'TEXT' || features[idx].type === 'LABEL')
            ) {
                // If already selected
                if(alreadySelected ) {
                    // Estimate cursor position
                    var text_height = selection.h;
                    ctx.font = "bold " + text_height + "px sans-serif";
                    var text_width = ctx.measureText(selection.val).width;

                    // Make text fit box
                    while(text_width > selection.w) {
                        text_height -= 1;
                        ctx.font = "bold " + text_height + "px sans-serif";
                        text_width = ctx.measureText(selection.val).width;
                    }

                    var x_pos = mx-selection.x;
                    var pos = (x_pos/text_width)*selection.val.length;
                    cursorPos = pos;
                }
                else{
                    cursorPos = selection.val.length;
                }
     
            }


            // Dont clear previous selection if ctrl is down
            if(!e.ctrlKey && !alreadySelected) {
                mySel = [];
                mySelId = [];
            }

            if(!alreadySelected) {
                mySel.push(features[idx]);
                mySelId.push(idx);
            }
            // Subtract from selection
            else if(e.ctrlKey) {
                mySel.forEach(function(val, id, array) {
                    if(val === selection) {
                        delete array[id];
                        delete mySelId[id];
                        if(mySelId.length !=0) {
                            lastSel = mySel[0];
                            lastSelId = mySelId[0];
                        }
                    }
                });
                return;
            }

            
            offsetx = mx - selection.x;
            offsety = my - selection.y;
            selection.x = mx - offsetx;
            selection.y = my - offsety;

            // Only drag on left click
            if(e.button !== 2)
                isDrag = true;
            
            // If selected an arrow
            if(val===200) {
                selArrow = true;
                // Unlink
                if(!(selection.target instanceof Object)) {
                    features[selection.target].linked = -1;
                }
                selection.target = {'x':mx, 'y':my, 'w':1, 'h':1};
            }
            else{
                selArrow = false;
            }


            if(e.button === 2) {
                showContextMenu(true);
                $('#contextmenu').offset({top:e.pageY, left:e.pageX});
            }

            invalidate();
            clear(gctx);
            return;
        }
    }
    // havent returned means we have selected nothing
    
    if(!e.ctrlKey) {
        clearSelection();
    }

    if(e.button === 2) {
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

function clearSelection() {
    if(text_changed === true) {
        saveState();
        text_changed = false;
    }
    mySel = [];
    mySelId = [];
    lastSel = null;
    lastSelId = -1;
}

function myUp(e) {
    isDrag = false;
    isResizeDrag = false;
    expectResize = -1;
    // Is the arrow inside a box?
    if(selArrow) {
        getMouse(e);
        for (idx in features) {
            if(!features.hasOwnProperty(idx)) {
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
                if((found.type === 'CHECKBOX' || found.type === 'TEXTBOX') &&
                        found.linked === -1) {
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
    if(isSelectionDrag) {
        if(!e.ctrlKey) {
            clearSelection();
        }
        for(idx in features) {
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
            if(x > min_x && x < max_x && y > min_y && y < max_y) {
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

function handleFiles(files) {

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

function newFeature(type, x, h, w, h) {
    var x = x || mx;
    var y = y || my;
    var w = w || 25;
    var h = h || 25;

    var idx = next_id++;
    var f = {'x' : x, 'y' : y, 'w' : w, 'h' : h, 'type' : type};
    
    if(type === 'LABEL') {
        f.w = 80;
        f.target = {'x':x+80+20, 'y':y+h, 'w':1, 'h':1};
        f.val = 'label';
        console.log(f);
    }
    else if(type === 'TEXT') {
        f.val = 'text';
        f.w = 80;
    }
    else if(type === 'TEXTBOX') {
        f.w = 80;
        f.linked = -1;
    }
    else if(type === 'CHECKBOX') {
        f.linked = -1;
    }
    invalidate();
    features[idx] = new Feature(f, 1);

}

function cloneSelected() {
    var newids = {};
    var newSel = [];
    var newSelId = [];
    // Clone
    mySelId.forEach(function(idx, array_id, array) {
        var newid = next_id++;
        newids[idx] = newid;
        // copy
        features[newid] = new Feature(features[idx], 1);
        // Offset slightly for visible effect
        features[newid].x +=10;
        features[newid].y +=10;


        newSel.push(features[newid]);
        newSelId.push(newid);
    });

    // Fix references
    mySelId.forEach(function(idx, array_id, array) {
        var newf = features[newids[idx]];
        // If label arrow is not dangling
        if(newf.type === 'LABEL') {
            // If the arrow is dangling
            if(newf.target instanceof Object || newf.target === -1) {
                features[newids[idx]].target = 
                        {'x':newf.x+80+20, 'y':newf.y+newf.h, 'w':1, 'h':1};
            }

            // If the target object has been cloned
            if(newids[newf.target] !== undefined) {
                features[newids[idx]].target = newids[newf.target];
            }

        }
        // If the label pointing to it has been not cloned
        else if(newf.linked !== -1 &&
                newids[newf.linked] === undefined) {
            features[newids[idx]].linked = -1;
        }
    });

    // Make new selection
    mySel = newSel;
    mySelId = newSelId;
    invalidate();
}

function splitText() {

    var x_split = cx;

    var right = lastSel.val.substring(cursorPos, lastSel.val.length);
    var left = lastSel.val.substring(0, cursorPos);

    ctx.font = "bold " + lastSel.h + "px sans-serif";
    var left_width = ctx.measureText(left).width;
    var right_width = ctx.measureText(right).width;

    // on right
    var id = next_id++;
    features[id] = new Feature({'type': 'TEXT', 'x':lastSel.x+left_width,
            'w':right_width, 'y':lastSel.y, 'h':lastSel.h,
            'val':right});
    

    // Edit original box on left
    lastSel.w = left_width;
    lastSel.val = left;
    invalidate();
}

function mergeSelectedText() {
    mySelId.sort(function(a,b) {
        if(features[a].y > features[b].y+features[b].h) {
            return true;
        }
        return features[a].x > features[b].x
    });
    var keep = features[mySelId[0]];
    var keep_id = mySelId[0];

    var newval = "";
    var width = 0;
    var last_y = keep.y;
    var height = keep.w;
    var max_width = keep.w;
    mySelId.forEach(function(id, idx, array) {
        var delim = " ";
        if(features[id].y > last_y) {
            delim = "\n"; // Work in progress
            last_y = features[id].y;
        }
        newval+= features[id].val + delim;
        width += features[id].w;
        if(id !== keep_id) {
            if(features[id].type === 'LABEL' && !(features[id].target instanceof Object)) {
                features[features[id].target].linked = -1;
            }
            delete features[id];
        }
    });

    keep.val = newval;
    keep.w = width;

    mySel = [keep];
    mySelId = [keep_id];
    lastSel = keep;
    lastSelId = keep_id;
    invalidate();
}

function initContextMenu() {

    if(contextmenuisinit) {
        return;
    }
    contextmenuisinit = true;

    window.oncontextmenu = function() {return false;};
    contextmenu.onmouseover = function() {contextMenuVisible=true}
    contextmenu.onmouseover = function() {contextMenuVisible=false}
    $('#delete').click(function() {
        deleteSelected();
        showContextMenu(false);
        return false;
    });
    $('#clone').click(function() {
        saveState();
        cloneSelected();
        showContextMenu(false);
        return false;
    });
    $('#split').click(function() {
        saveState();
        splitText();
        showContextMenu(false);
        return false;
    });
    $('#merge').click(function() {
        saveState();
        mergeSelectedText();
        showContextMenu(false);
        return false;
    });

    $('#newlabel').click(function(e) {
        saveState();
        getMouse(e);
        newFeature('LABEL', cx, cy);
        showContextMenu(false);
        return false;
    });
    $('#newtextbox').click(function(e) {
        saveState();
        getMouse(e);
        newFeature('TEXTBOX', cx, cy);
        showContextMenu(false);
        return false;
    });
    $('#newcheckbox').click(function(e) {
        saveState();
        getMouse(e);
        newFeature('CHECKBOX', cx, cy);
        showContextMenu(false);
        return false;
    });
    $('#newtext').click(function(e) {
        saveState();
        getMouse(e);
        newFeature('TEXT', cx, cy);
        showContextMenu(false);
        return false;
    });

    $('#convertlabel').click(function() {
        saveState();
        lastSel.type = "LABEL";
        lastSel.target = {'x':lastSel.x+lastSel.w+20, 'y':lastSel.y+lastSel.h, 'w':1, 'h':1}
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#converttext').click(function() {
        saveState();
        lastSel.type = "TEXT";
        if(!(lastSel.target instanceof Object))
            features[lastSel.target].linked = -1;
        lastSel.target = undefined;
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#converttextbox').click(function() {
        saveState();
        lastSel.type = "TEXTBOX";
        showContextMenu(false);
        invalidate();
        return false;
    });
    $('#convertcheckbox').click(function() {
        saveState();
        lastSel.type = "CHECKBOX";
        lastSel.w = lastSel.h;
        showContextMenu(false);
        invalidate();
        return false;
    });
}

function showContextMenu(show) {
    if(!show) {
        $('#contextmenu').hide();
        return
    }
    
    if(!mainDrawOn) {
        return;
    }

    // set seed point
    if(!contextMenuVisible) {
        cx = mx;
        cy = my;
    }

    var type;
    if(mySel.length > 1)
        type = "MULTI";
    else if(mySel.length === 1)
        type = lastSel.type;
    else
        type = 'NONE';
    

    $('#newlabel').hide();
    $('#newtextbox').hide();
    $('#newtext').hide();
    $('#newcheckbox').hide();

    $('#convertlabel').hide();
    $('#convertcheckbox').hide();
    $('#converttextbox').hide();
    $('#converttext').hide();

    $('#delete').show();
    $('#clone').show();
    $('#merge').hide();
    $('#split').hide();

    $('.topSep').hide();
    $('.bottomSep').show();

    switch(type) {
        case 'NONE':
            $('#newlabel').show();
            $('#newtextbox').show();
            $('#newtext').show();
            $('#newcheckbox').show();
            $('#delete').hide();
            $('#clone').hide();
            $('.bottomSep').hide();
            break;
        case 'TEXT':
            if(cursorPos !== lastSel.val.length) {
                $('#split').show();
            }
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
            $('.bottomSep').hide();
            var can_merge = mySel.every(function(f) {
                // Need to take label into account
                if(f.type === 'TEXT' || f.type === 'LABEL') {
                    return true;
                }
            });
            if(can_merge)
                $('#merge').show();
            break;
    }

    $('#contextmenu').show();
}


function setEvents(on) {
    if(on) {
        canvas.onmousedown = myDown;
        canvas.onmouseup = myUp;
        canvas.ondblclick = myDblClick;
        canvas.onmousemove = myMove;
        document.onkeypress = myKey;
        document.onkeydown = myNonTextKey;
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
    $('#undo').show();
    $('#undo').click(restoreState);
    $('#process').unbind('click');
    $("#process").hide();
    $("#prevbutton").show();
    $("#prevbutton").click(preview);
    $("#done").click(finalise);
    $("#done").show();
    $("#checkboxes").show();
    $("#checkboxes").click(invalidate);
    $("#showresults").click(function() {
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
    if(mainDrawInit === false) {
        setInterval(mainDraw, INTERVAL);
        setInterval(drawCursor, CURSOR_INTERVAL);
        //setInterval(saveState, SAVE_INTERVAL);
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

    invalidate();
}

function initCanvas() {
    $("#done").hide();
    $('#done').unbind('click');
    $("#input").hide();
    $("#prevbutton").hide();
    $('#prevbutton').unbind('click');
    $("#process").show();
    $("#process").click(upload);
    $("#checkboxes").hide();
    scale = calc_scale(940, 0, image);
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


function initFeatures(json) {
    for(var id in json) {
        if(!json.hasOwnProperty(id)) {
            break;
        }

        features[id] = new Feature(json[id], scale/submit_scale);

        // Trim bounding boxes
        if(features[id].type === 'TEXT' || features[id].type === 'LABEL') {
            ctx.font = "bold " + features[id].h + "px sans-serif";
            var text_width = ctx.measureText(features[id].val).width;
            if(text_width < features[id].w) {
                features[id].w = text_width;
            }
        }

    }
    history = [];
    //saveState();
    initVerify();
    $("#throbber").hide();
}

function upload() {

    $("#throbber").show();

    // Resize image    
    submit_scale = calc_scale(IMG_UPLOAD_MIN_X, IMG_UPLOAD_MIN_Y, image);

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

    if(fakeit) {
        initFeatures(testdata);
        return;
    }

    var post = $.post(url, params, initFeatures, 'json');

    post.error(function() {
        alert("Something terrible happened. I cannot upload your form");
        $("#throbber").hide();
    });
}

function isLabelTargetsValid() {
    for(idx in features) {
        if(features.hasOwnProperty(idx)) {
            if(features[idx].type === 'LABEL'
                    && features[idx].target instanceof Object) {
                return features[idx].val;            
            }
        }
    }
    return true;
}

function preview() {
    if($("#prevbutton").val() === 'Edit') {
        $("#prevbutton").val('Preview');
        $("#canvas2").show();
        $("#preview").hide();
        $("#checkboxes").show();
        return;
    }
    
    var valid = isLabelTargetsValid();
    if(valid !== true) {
            window.alert("Label '" + valid + "' is not pointing to a field," +
            " please make sure all label arrows have targets.");
            return false;
    }
    $("#throbber").show();
    var url = '/preview'
    var data = JSON.stringify(features);
    var params = {"_csrf":csrf, "features": data}
    var post = $.post(url, params, function(html) {
        $("#inpreview").html(html);
        $("#preview").show();
        $("#canvas2").hide();
        $("#prevbutton").val('Edit');
        $("#checkboxes").hide();
        $("#throbber").hide();
    }, "html");

    post.error(function() {
        alert("Something terrible happened. I cannot show you the preview");
        $("#throbber").hide();
    });

}


function finalise() {
    var valid = isLabelTargetsValid();
    if(valid !== true) {
            window.alert("Label '" + valid + "' is not pointing to a field," +
            " please make sure all label arrows have targets.");
            return false;
    }

    $("#throbber").show();

    var url = '/finalise'
    var data = JSON.stringify(features);
    var params = {"_csrf":csrf, "features": data}
    var post = $.post(url, params, function(json) {
        window.location = '/form?id=' + json.id;
    }, 'json');

    post.error(function() {
        alert("Something terrible happened. I cannot finalise your form");
        $("#throbber").hide();
    });
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