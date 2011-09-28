/*
    Deals with non character key stokes
*/
function onNonCharKey(e) {
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

/*
    Deals with input characters
*/
function onKey(e) {
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

/*
    Mouse movements inside canvas
*/
function onMove(e) {
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


/* 
    Mouse is pressed down inside canvas
*/
function onDown(e) {
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
                if(mySel[i] !== undefined && mySel[i] === features[idx]) {
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

                    // Adjust text size to fit box
                    while(text_width > selection.w) {
                        text_height -= 1;
                        ctx.font = "bold " + text_height + "px sans-serif";
                        text_width = ctx.measureText(selection.val).width;
                    }

                    // Find position
                    var x_pos = mx-selection.x;
                    var pos = (x_pos/text_width)*selection.val.length;
                    var x_est = ctx.measureText(selection.val.slice(0,pos)).width;
                    var delta = delta = x_pos-x_est;
                    var limit = 5; // Incase something goes terribly wrong
                    while(Math.abs(delta) > text_height/4 && limit > 0){
                        pos = delta<0 ? pos-1 : pos+1; 
                        x_est = ctx.measureText(selection.val.slice(0,pos)).width;
                        delta = x_pos-x_est;
                        limit--;
                    }
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
                        delete mySel[id];
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

/*
    When mouse button is lifted inside canvas
*/
function onUp(e) {
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

    var all_textbox = true;
    for(var i = 0; i < mySel.length; i++){
        if(mySel[i] !== undefined && mySel[i].type !== 'TEXTBOX'){
            all_textbox = false;
            break;
        }
    }

    if(mySel.length > 0 && all_textbox){
        
        // Negavtive select deletes and set to undefined
        var sel = undefined;
        for(var i = 0; i < mySel.length; i++){
            if(mySel[i] !== undefined){
                sel = mySel[i];
                break;
            }
        }
        
        if(sel !== undefined){
            $('#textbox_restrictions').fadeIn();
            $('#max_len').val(sel.max_len);
            $('#min_len').val(sel.min_len);
            $('#not_empty').prop("checked", sel.not_empty);
        }
        
    }
    else{
        $('#textbox_restrictions').fadeOut();
    }

    isSelectionDrag = false;
    invalidate();
}

/*
    If textbox retrictions change
*/
function onTBRestrChng(e){

    var max_len = parseInt($('#max_len').val(), 10);
    var min_len = parseInt($('#min_len').val(), 10);

    for(var i = 0; i < mySel.length; i++){

        // Negavtive select deletes and set to undefined
        if(mySel[i] === undefined)
            continue;
        

        if(max_len)
            mySel[i].max_len = max_len;
        else
            mySel[i].max_len = 0;
        if(min_len)
            mySel[i].min_len = min_len;
        else
            mySel[i].min_len = 0;

        if(max_len === max_len && max_len === max_len &&
                min_len > max_len){
            mySel[i].min_len = 0;
            $('#min_len').val(0);
        }

        mySel[i].not_empty = $('#not_empty').is(':checked'); 
    }
}