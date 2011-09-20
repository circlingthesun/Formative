<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />


<%def name="js()">
    ${parent.js()}
    ${self.js_link("/static/js/jquery-1.6.2.min.js")}
    ${self.js_link("/static/js/testdata.js")}
    ${self.js_link("/static/js/formative.js")}
    ${self.js_link("/static/js/draw.js")}
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
	var fakeit = true;
	$(function(){
	    var inputElement = document.getElementById("input");  
		inputElement.addEventListener("change", handleFiles, false);
	});
</%def>

<div id="toolbox">
	<input type="file" id="input">
	<input id="process" type="button" value="process" style="display:none">
	<span id="checkboxes" style="display:none">
		show original
		<input id="showoriginal" type="checkbox"/>
		show results
		<input id="showresults" type="checkbox" checked />
	</span>
</div>
<hr />

<canvas id="canvas2" width="900" height="60">
    This text is displayed if your browser does not support HTML5 Canvas.
</canvas>


<div id="contextmenu"
 style="border: 1px solid gray; display: none; position: absolute">
    <div class="cmenu">
        <span><a id="newlabel" href="#">New label</a></span>
        <span><a id="newtextbox" href="#">New textbox</a></span>
        <span><a id="newcheckbox" href="#">New checkbox</a></span>
        <span><a id="newtext" href="#">New text</a></span>
        
        <hr class="topSep"/>
        <span><a id="convertlabel" href="#">Convert to label</a></span>
        <span><a id="converttext" href="#">Convert to text</a></span>
        <span><a id="convertcheckbox" href="#">Convert to checkbox</a></span>
        <span><a id="converttextbox" href="#">Convert to textbox</a></span>

        <hr class="bottomSep"/>
        <span><a id="delete" href="#">Delete</a></span>
    </div>
</div>