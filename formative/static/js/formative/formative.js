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

// Hold canvas references
var canvas;
var ctx;

// Use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx;

// Canvase width & height
var WIDTH;
var HEIGHT;

// Has the selected object's text changed?
var text_changed = false;

// Title of the form to be created
var form_title = "";

// Drag variables
var isDrag = false;
var isSelectionDrag = false;
var isResizeDrag = false;

// Saves the # of the selection handle if the
// mouse is over one.
var expectResize = -1;  

// Mouse coordinates relavtive to canvas
var mx, my;

// Drag selection start point
var selX, selY;

// Should the main draw loop draw
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


/*
    Deletes all selected items
*/
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
    $('#textbox_restrictions').fadeOut();
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
        var mean_height = (features[a].h+features[b].h)/2;
        var delta = Math.abs(features[a].y - features[b].y);
        if(delta > mean_height) {
            return features[a].y > features[b].y;
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
        canvas.onmousedown = onDown;
        canvas.onmouseup = onUp;
        canvas.onmousemove = onMove;
        document.onkeypress = onKey;
        document.onkeydown = onNonCharKey;
        window.oncontextmenu = function() {return false;};
        initContextMenu();
        
    }
    else{
        canvas.onmousedown = undefined;
        canvas.onmouseup =  undefined;
        canvas.onmousemove = undefined;
        document.onkeypress = undefined;
        document.onkeydown = undefined;
        window.oncontextmenu = undefined;
    }
}

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function initVerify() {
    // Initialise listeners on toolpanel
    $("#input").hide();
    $('#process').unbind('click');
    $("#process").hide();

    $('#undo').show();
    $('#undo').attr("disabled", "disabled");
    $('#undo').click(restoreState);
    $("#prevbutton").show();
    $("#prevbutton").click(preview);
    $("#done").click(save);
    $("#done").show();
    $("#checkboxes").show();
    $("#checkboxes").click(invalidate);
    $("#showresults").click(function() {
        setEvents($("#showresults").is(':checked'));
    });

    // Textbox retsrictions change
    $('#max_len').keyup(onTBRestrChng);
    $('#min_len').keyup(onTBRestrChng);
    $('#not_empty').change(onTBRestrChng);


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
    $("#done").fadeOut();
    $('#done').unbind('click');
    $("#prevbutton").fadeOut();
    $('#prevbutton').unbind('click');
    $("#process").fadeIn();
    $("#process").click(process);
    $("#checkboxes").fadeOut();    
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


/*
    Feature factory creates new features and sets attributes
*/
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
    }
    else if(type === 'TEXT') {
        f.val = 'text';
        f.w = 80;
    }
    else if(type === 'TEXTBOX') {
        f.w = 80;
        f.linked = -1;
        f.max_len = 0;
        f.min_len = 0;
        f.not_empty = false;
    }
    else if(type === 'CHECKBOX') {
        f.linked = -1;
    }
    invalidate();
    features[idx] = new Feature(f, 1);

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
    $("#throbber").fadeOut();
}

function process() {

    $("#throbber").fadeIn();

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
        alert("Something terrible happened. I cannot process your form");
        $("#throbber").fadeOut();
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
        $("#canvas2").fadeIn();
        $("#preview").fadeOut();
        $("#checkboxes").fadeIn();
        setEvents(true);
        return;
    }

    var valid = isLabelTargetsValid();
    if(valid !== true) {
            
            var msg = "Label '" + valid + "' is not pointing to a field," +
                    " please make sure all label arrows have targets.";
            unlinked(msg);
            return false;
    }

    // Avoid editing form during preview
    setEvents(false);

    $("#throbber").fadeIn();
    var url = '/preview'
    var data = JSON.stringify(features);
    var params = {"_csrf":csrf, "features": data}
    var post = $.post(url, params, function(html) {
        $("#inpreview").html(html);
        $("#preview").fadeIn();
        $("#canvas2").fadeOut();
        $("#prevbutton").val('Edit');
        $("#checkboxes").fadeOut();
        $("#throbber").fadeOut();
    }, "html");

    post.error(function() {
        alert("Something terrible happened. I cannot show you the preview");
        $("#throbber").fadeOut();
    });

}

function signUp(){
    $("#throbber").fadeIn();
    var url = '/signup'
    var email = $('#email').val();
    var params = {"_csrf":csrf, "email":email }
    var post = $.post(url, params, function(json) {
        $("#throbber").fadeOut();
        if(json.success){
            $.modal.close();
            logged_on=true;
            save();
        }
        else{
            $('#email_error').html(json.error);
        }
    }, 'json');

    post.error(function() {
        alert("Something terrible happened. I cannot save your form");
        $("#throbber").fadeOut();
    });
}


function setTitle(){
    var title = $("#title").val();
    if(title.length < 3){
        $("#title_error").html("The title needs to be 3 letters or longer.");
    }
    else{
        form_title = title;
        $.modal.close();
        // Does not work without delay
        setTimeout(save,500);
        //save();
    }
}

/*
    Shows error unlinked labels error message
*/
function unlinked(msg){
    $("#unlinked").modal();
    $('#unlinked_msg').html(msg);
}

/*
    Attempts to save the generated form to the server
*/
function save() {
    var valid = isLabelTargetsValid();
    if(valid !== true) {
            var msg = "Label '" + valid + "' is not pointing to a field," +
                    " please make sure all label arrows have targets.";
            unlinked(msg);
            return false;
    }

    // Get a form title
    if(form_title.length < 3){
        $("#form_title").modal();
        return;
    }

    // Make user signup first
    if(!logged_on){
        $("#signup").modal();
        return;
    }

    $("#throbber").fadeIn();

    var url = '/save'
    var data = JSON.stringify(features);
    var params = {"_csrf":csrf, "features": data, "title":form_title}
    var post = $.post(url, params, function(json) {
        window.location = '/form/' + json.id + '/created';
    }, 'json');

    post.error(function() {
        alert("You crashed the server. I cannot save your form");
        $("#throbber").fadeOut();
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