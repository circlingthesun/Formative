<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />


<%def name="js()">
    ${parent.js()}
    ${self.js_link("/static/js/jquery-1.6.2.min.js")}
    ${self.js_link("/static/js/testdata.js")}
    ${self.js_link("/static/js/helpers.js")}
    ${self.js_link("/static/js/feature.js")}
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