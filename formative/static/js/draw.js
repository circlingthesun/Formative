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

var drawTextbox = function(context, boxColor, ghostArrowColour) {
    if (context === gctx) {
        context.fillStyle = boxColor;
    } else {
        context.fillStyle = 'rgba(2,165,165,0.7)'; // Green/blue
    }

    context.fillRect(this.x,this.y,this.w,this.h);
    
}


var drawCheckbox = function(context, boxColor, ghostArrowColour) {
    if (context === gctx) {
        context.fillStyle = boxColor;
    } else {
        context.fillStyle = 'rgba(150,150,250,0.7)'; // Purle
    }

    context.fillRect(this.x,this.y,this.w,this.h);
    
}

var drawLabel = function(context, boxColor, ghostArrowColour) {
    if (context === gctx) {
        context.fillStyle = boxColor;
    } else {
        context.fillStyle = 'rgba(255,255,255,0.9)'; // White
    }

    context.fillRect(this.x,this.y,this.w,this.h);

    this.drawText(context, boxColor, ghostArrowColour);


    // Draw arrow pointing to target

    // Draw border around label
    context.strokeStyle = 'rgba(0,0,0,1.0)';
    context.lineWidth = 1;
    context.strokeRect(this.x,this.y,this.w,this.h);

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