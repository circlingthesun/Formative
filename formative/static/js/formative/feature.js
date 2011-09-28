// Small rectangles for selectoion resize
function SelectorRect() {
    this.x;
    this.y;
    this.w;
    this.h;
}

// New, holds the 8 tiny boxes that will be our selection handles
// the selection handles will be in this order:
// 0    1    2
// 3         4
// 5    6    7
var selectionHandles = [];

/*
    Feature resprents form elements found
*/
function Feature(ob, scale) {
    var scale = scale || 1;
    this.x = ob.x * scale;
    this.y = ob.y * scale;
    this.w = ob.w * scale;
    this.h = ob.h * scale;
    this.val = ob.val; // Text
    this.max_len = ob.max_len;
    this.min_len = ob.min_len;
    this.not_empty = ob.not_empty;
    this.type = ob.type;
    this.linked = ob.linked; // key of label pointing to it
    if(!(ob.target instanceof Object)) {
        this.target = ob.target;
    }
    else if( ob.target !== undefined) {
        this.target = {'x': ob.target.x, 'y':ob.target.y,
            'w':ob.target.w, 'h':ob.target.h};    
    }

}

/*
    Define feature prototype
*/
Feature.prototype = {

    drawTextbox: function(context, ghostColour) {
            if (context === gctx) {
                context.fillStyle = ghostColour;
                context.fillRect(this.x,this.y,this.w,this.h);
                return;
            } else {
                context.fillStyle = 'rgba(2,165,165,0.7)'; // Green/blue
            }

            //context.fillRect(this.x,this.y,this.w,this.h);
            context.lineWidth = 2;
            context.strokeStyle = 'rgba(0,0,0,1.0)';
            context.fillStyle = TEXTBOX_COLOUR;//'rgba(157,212,178,0.7)';
            roundRect(context, this.x, this.y, this.w, this.h, 5, true, true);
            
    },


    drawCheckbox: function(context, ghostColour) {
            if (context === gctx) {
                context.fillStyle = ghostColour;
                context.fillRect(this.x,this.y,this.w,this.h);
                return;
            } else {
                context.fillStyle = 'rgba(2,165,165,0.7)'; // Green/blue
            }

            //context.fillRect(this.x,this.y,this.w,this.h);
            context.lineWidth = 2;
            context.strokeStyle = 'rgba(0,0,0,1.0)';
            context.fillStyle = CHECKBOX_COLOUR;//'rgba(211,157,212,0.7)';
            roundRect(context, this.x, this.y, this.w, this.h, 5, true, true);
            cross(context, this.x, this.y, this.w, this.h, 4);
    },

    drawLabel: function(context, ghostColour, ghostArrowColour) {
        if (context === gctx) {
            context.fillStyle = ghostColour;
            context.fillRect(this.x,this.y,this.w,this.h);
        } 
        
        this.drawText(context, ghostColour, ghostArrowColour);

        // Draw arrow pointing to target
        from = this;
        var fromX = this.x;
        var fromY = this.y;
        var fromW = this.w;
        var fromH = this.h;

        var to;
        // Deal hanging pointers
        // In an ideal world I do not have to deal with this
        if(this.target instanceof Object ) {
            to = this.target
        }
        else if(features[this.target] === undefined) {
            to = {'x':this.x+this.w+20, 'y':this.y+this.h,
                    'w':1, 'h':1};
        }
        else{
            to = features[this.target];
        }

        var toX = to.x;
        var toY = to.y;
        var toW = to.w;
        var toH = to.h;
        
        // Only draw the end of the arrow for the ghost canvas
        if(context === gctx) {
            context.fillStyle = ghostArrowColour;
            context.strokeStyle = ghostArrowColour;
        }
        else{
            context.strokeStyle = ARROW_COLOUR;//'rgba(255,50,50,1.0)';
            context.fillStyle = ARROW_COLOUR;//'rgba(255,50,50,1.0)';
        }

        // Where is the target relative to the label?
        // If right
        if(to.x > from.x + from.w) {
           toY = to.y + to.h/2;
           fromY = from.y+from.h/2;
           fromX = from.x+from.w;
        }
        // If left
        else if(to.x + to.w < from.x) {
            toY = to.y + to.h/2;
            toX = to.x + to.w;
            fromY = from.y+from.h/2;
            //fromX = from.x;
        }
        // If horisontal middle
        else{
            toX = to.x + to.w/2;
            // If ontop
            if(to.y+to.h < from.y) {
                fromX = from.x + from.w/2;
                toY = to.y + to.h;
            }
            // If bottom
            else if(to.y > from.y+from.h) {
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
        if(context === ctx) {
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


        // Draw nice line under the text
        if(context !== gctx) {
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(0,0,0,1.0)';
            context.beginPath();
            context.moveTo(this.x+this.w, this.y+this.h);
            context.lineTo(this.x, this.y+this.h);
            context.closePath();
        	context.stroke();
        }


    },

    drawText: function(context, ghostColour) {
        
        if (context === gctx) {
            context.fillStyle = ghostColour; // not white
        }
        else{
            context.fillStyle = 'rgba(255,255,255,0.9)'; // White
        }

        context.fillRect(this.x,this.y,this.w,this.h);

        // No text for ghost canvas
        if(context === gctx) {
            return;
        }

        context.fillStyle = 'rgba(0,0,0,1.0)';
        context.textBaseline = 'bottom';
        var text_height = this.h;
        context.font = "bold " + text_height + "px sans-serif";
        var text_width = context.measureText(this.val).width;

        // Make text fit box
        while(text_width > this.w) {
            text_height -= 1;
            context.font = "bold " + text_height + "px sans-serif";
            text_width = context.measureText(this.val).width;
        }
        
        
        context.fillText(this.val, this.x, this.y+this.h, this.w);
        
    },


    drawHandles: function (context, ghostColour) {

        // draw selection
        // is it selected?
        var isSelected = false;
        for(var i = 0; i < mySel.length; i++) {
            if(mySel[i] === this) {
                isSelected = true;
                break;
            }
        }

        if (isSelected) {
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
    },

    // mainDraw() will call this with the normal canvas
    // myDown will call this with the ghost canvas with 'black'
    draw :function(context, ghostColour, ghostArrowColour) {
            this.drawHandles(context, ghostColour);
            // We can skip the drawing of elements that have moved off the screen:
            if (this.x > WIDTH || this.y > HEIGHT) return; 
            if (this.x + this.w < 0 || this.y + this.h < 0) return;

            if (context === gctx) {
                context.fillStyle = ghostColour;
            }

            switch(this.type) {
                case 'TEXTBOX':
                    this.drawTextbox(context, ghostColour);
                    break;
                case 'CHECKBOX':
                    this.drawCheckbox(context, ghostColour);
                    break;
                case 'LABEL': 
                    this.drawLabel(context, ghostColour, ghostArrowColour);
                    break;
                case 'TEXT':
                    this.drawText(context, ghostColour);
                    break;        
            }    
            
    }
}