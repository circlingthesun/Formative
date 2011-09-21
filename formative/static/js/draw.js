function drawCursor(){
    context = ctx;
    cursorOnTime--;
    if(mySel.length !== 0 && lastSel != null && (lastSel.type == 'TEXT' || lastSel.type == 'LABEL') ){
        if(cursorOnTime > 5){

            // Calculate the display text height
            var text_height = lastSel.h;
            context.font = "bold " + text_height + "px sans-serif";
            var text_width = context.measureText(lastSel.val).width;

            // Make text fit box
            while(text_width > lastSel.w){
                text_height -= 1;
                context.font = "bold " + text_height + "px sans-serif";
                text_width = context.measureText(lastSel.val).width;
            }

            // Get the text at the cursor position
            // WARNING does not meature white space
            var text = lastSel.val.substring(0,cursorPos);
            var x = lastSel.x + context.measureText(text).width;

            context.strokeStyle = 'black';
            context.lineWidth   = 1;
            context.beginPath();
            context.moveTo(x, lastSel.y+2);
            context.lineTo(x, lastSel.y+lastSel.h-2);
            context.closePath();
            context.stroke();
        }
        if(cursorOnTime === 5){
            invalidate();
        }
        else if(cursorOnTime <= 0){
            cursorOnTime = 10;
        }
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