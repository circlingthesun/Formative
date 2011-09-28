<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />


<%def name="js()">
    ${parent.js()}
    ${self.js_link("/static/js/jquery-1.6.2.min.js")}
    ${self.js_link("/static/js/jquery.simplemodal.1.4.1.min.js")}
    ${self.js_link("/static/js/formative/testdata.js")}
    ${self.js_link("/static/js/formative/settings.js")}
    ${self.js_link("/static/js/formative/events.js")}
    ${self.js_link("/static/js/formative/feature.js")}
    ${self.js_link("/static/js/formative/formative.js")}
    ${self.js_link("/static/js/formative/draw.js")}
</%def>

<%def name="css()">
    ${parent.css()}
</%def>

<%def name="style_section()">
    ${parent.style_section()}
</%def>

<%def name="script_section()">
	${parent.script_section()}
	var csrf = "${csrf}";
    var logged_on = ${logged_on};
	var fakeit = true;
	$(function(){
	    var inputElement = document.getElementById("input");  
		inputElement.addEventListener("change", handleFiles, false);
        // Point to upload button
        var canvas = document.getElementById('canvas2');
        var context = canvas.getContext('2d');
        context.lineWidth = 10;
        context.strokeStyle = ARROW_COLOUR;
        context.fillStyle = ARROW_COLOUR;
        arrow(context, 65, 50, 65, 10, 25);

        // Create floating toolbox
        var toolbox = $('#toolbox');
        var w = $(window);
        var orig_top = toolbox.offset().top;

        $(window).bind('scroll', function() {
            var offset = toolbox.offset();
            var pos = w.scrollTop();

            if(pos > orig_top){
                toolbox.offset({'left':offset.left, 'top':pos});
            }
            else{
                toolbox.offset({'left':offset.left, 'top':orig_top});
            }
        });

	});


</%def>


    <div id="toolbox" class="container_12">
        <div class="grid_12">
        <input id="done" type="button" value="Save" style="display:none">
    	<input id="process" type="button" value="Process"
                style="display:none">
        <input id="input" type="file">
        <input id="prevbutton" type="button" value="Preview"
                style="display:none">
    	<span id="checkboxes" style="display:none">
            <input id="showoriginal" type="checkbox"/>
    		show original
    		<input id="showresults" type="checkbox" checked />
    		show results
    	</span>
        <input id="undo" type="button" value="Undo"
                style="display:none;disabled:disabled;float:right;">
        <img src="/static/images/ajax-loader.gif" id="throbber"
                style="display:none;float:right"/>
        </div>
        <div id="textbox_restrictions" class="grid_12" style="display:none">
            <hr/>
            Minimum size: <input id="min_len" type="textbox" value="" size=2/>
            &nbsp &nbsp
            Maximum size: <input id="max_len" type="textbox" value="" size=2/>
            &nbsp &nbsp
            <input id="not_empty" type="checkbox" value="true"/> Can not be empty
        </div>
    </div>
    <div id="push_toolbox"></div>

<div class="container_12">
    <canvas id="canvas2" class="grid_12" width="940" height="200">
        This text is displayed if your browser does not support HTML5 Canvas.
    </canvas>

    <div id="preview" style="display:none" class="grid_12">
        <div id="inpreview"></div>
    </div>
</div>


<div id="contextmenu"
 style="border: 1px solid gray; display: none; position: absolute">
    <div class="cmenu">
        <a id="newlabel" href="#"><span>New label</span></a>
        <a id="newtextbox" href="#"><span>New textbox</span></a>
        <a id="newcheckbox" href="#"><span>New checkbox</span></a>
        <a id="newtext" href="#"><span>New text</span></a>
        
        <hr class="topSep"/>
        <a id="convertlabel" href="#"><span>Convert to label</span></a>
        <a id="converttext" href="#"><span>Convert to text</span></a>
        <a id="convertcheckbox" href="#"><span>Convert to checkbox</span></a>
        <a id="converttextbox" href="#"><span>Convert to textbox</span></a>
        <hr class="bottomSep"/>
        <a id="merge" href="#"><span>Merge</span></a>
        <a id="split" href="#"><span>Split here</span></a>
        <a id="clone" href="#"><span>Clone</span></a>
        <a id="delete" href="#"><span>Delete</span></a>
    </div>
</div>

<div id="signup" class="modal" style="display:none;">
    <strong>Please provide your email address so we may save your form.</strong>
    <br />
    <input id="email" type="text" size="50">
    <div id="email_error" class="error"></div>
    <br />
    <input id="signup_button" type="button" value="Save" onclick="signUp();">
</div>

<div id="form_title" class="modal" style="display:none;">
    <strong>Please enter a form title</strong>
    <br />
    <input id="title" type="text" size="50">
    <div id="title_error" class="error"></div>
    <br />
    <input id="title_button" type="button" value="Save" onclick="setTitle();">
</div>

<div id="unlinked" class="modal" style="display:none;">
    <strong id="unlinked_msg"></strong>
    <br />
    <img src="/static/images/unlinked.gif" />
    <br />
    <input type="button" value="Whoops, okay" onclick="$.modal.close();">
</div>