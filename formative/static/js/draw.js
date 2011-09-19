function drawCursor(){
    context = ctx;
    if(mySel != null && (mySel.type == 'TEXT' || mySel.type == 'LABEL') ){
        if(cursorOn){

            // Calculate the display text height
            var text_height = mySel.h;
            context.font = "bold " + text_height + "px sans-serif";
            var text_width = context.measureText(mySel.val).width;

            // Make text fit box
            while(text_width > mySel.w){
                text_height -= 1;
                context.font = "bold " + text_height + "px sans-serif";
                text_width = context.measureText(mySel.val).width;
            }

            // Get the text at the cursor position
            // WARNING does not meature white space
            var text = mySel.val.substring(0,cursorPos);
            var x = mySel.x + context.measureText(text).width;

            context.strokeStyle = 'black';
            context.lineWidth   = 1;
            context.beginPath();
            context.moveTo(x, mySel.y+2);
            context.lineTo(x, mySel.y+mySel.h-2);
            context.closePath();
            context.stroke();
        }
        else{
            invalidate();
        }


        cursorOn = !cursorOn;

    }
}


/**
 * SOURCE:
 * http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-
 * rectangle-on-html-canvas
 * Draws a rounded rectangle using the current state of the canvas. 
 */
function roundRect(context, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined" ) {
        stroke = true;
    }
        if (typeof radius === "undefined") {
        radius = 5;
    }
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    if (stroke) {
        context.stroke();
    }
    if (fill) {
        context.fill();
    }
}

function cross(context, x, y, w, h, pad){
    context.beginPath();
    context.moveTo(x+pad, y+pad);
    context.lineTo(x + w - pad, y + h - pad);

    context.moveTo(x + w -pad, y  +pad);
    context.lineTo(x + pad, y + h - pad);
    context.closePath();
    context.stroke();
}

var drawTextbox = function(context, boxColor, ghostArrowColour) {
    if (context === gctx) {
        context.fillStyle = boxColor;
        context.fillRect(this.x,this.y,this.w,this.h);
        return;
    } else {
        context.fillStyle = 'rgba(2,165,165,0.7)'; // Green/blue
    }

    //context.fillRect(this.x,this.y,this.w,this.h);
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(0,0,0,1.0)';
    context.fillStyle = 'rgba(157,212,178,0.7)';
    roundRect(context, this.x, this.y, this.w, this.h, 5, true, true);

}


var drawCheckbox = function(context, boxColor, ghostArrowColour) {
    if (context === gctx) {
        context.fillStyle = boxColor;
        context.fillRect(this.x,this.y,this.w,this.h);
        return;
    } else {
        context.fillStyle = 'rgba(2,165,165,0.7)'; // Green/blue
    }

    //context.fillRect(this.x,this.y,this.w,this.h);
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(0,0,0,1.0)';
    context.fillStyle = 'rgba(211,157,212,0.7)';
    roundRect(context, this.x, this.y, this.w, this.h, 5, true, true);
    cross(context, this.x, this.y, this.w, this.h, 4);
}

var drawLabel = function(context, boxColor, ghostArrowColour) {
    if (context === gctx) {
        context.fillStyle = boxColor;
        context.fillRect(this.x,this.y,this.w,this.h);
    } else {
        context.lineWidth = 1;
        context.fillStyle = 'rgba(255,255,255,0.9)'; // White
        context.strokeStyle = 'rgba(0,0,0,1.0)';
        roundRect(context, this.x, this.y, this.w, this.h, 5, true, true);
    }


    this.drawText(context, boxColor, ghostArrowColour);

    // Draw arrow pointing to target

    from = this;
    var fromX = this.x;
    var fromY = this.y;
    var fromW = this.w;
    var fromH = this.h;

    // Deal with deleted targets
    var to;
    if(this.target instanceof Object){
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
        context.fillStyle = ghostArrowColour;
        context.strokeStyle = ghostArrowColour;
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
    var headlen = 18;   // length of head in pixels
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

var drawText = function(context, boxColor, ghostArrowColour) {

    if (context === gctx) {
        context.fillStyle = boxColor; // not white
    }
    else{
        context.fillStyle = 'rgba(255,255,255,0.9)'; // White
    }

    context.fillRect(this.x,this.y,this.w,this.h);

    // No text for ghost canvas
    if(context === gctx){
        return;
    }

    context.fillStyle = 'rgba(0,0,0,1.0)';
    context.textBaseline = 'bottom';
    var text_height = this.h;
    context.font = "bold " + text_height + "px sans-serif";
    var text_width = context.measureText(this.val).width;

    // Make text fit box
    while(text_width > this.w){
        text_height -= 1;
        context.font = "bold " + text_height + "px sans-serif";
        text_width = context.measureText(this.val).width;
    }
    
    
    context.fillText(this.val, this.x, this.y+this.h, this.w);
    
}

// mainDraw() will call this with the normal canvas
// myDown will call this with the ghost canvas with 'black'
var draw = function(context, boxColor, ghostArrowColour) {

    // We can skip the drawing of elements that have moved off the screen:
    if (this.x > WIDTH || this.y > HEIGHT) return; 
    if (this.x + this.w < 0 || this.y + this.h < 0) return;

    if (context === gctx) {
        context.fillStyle = boxColor;
    }

    switch(this.type){
        case 'TEXTBOX':
            this.drawTextbox(context, boxColor, ghostArrowColour);
            break;
        case 'CHECKBOX':
            this.drawCheckbox(context, boxColor, ghostArrowColour);
            break;
        case 'LABEL': 
            this.drawLabel(context, boxColor, ghostArrowColour);
            break;
        case 'TEXT':
            this.drawText(context, boxColor, ghostArrowColour);
            break;        
    }
    
    
       
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
    
} // end draw