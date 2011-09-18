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
	$(function(){
	    var inputElement = document.getElementById("input");  
		inputElement.addEventListener("change", handleFiles, false);
		$("#process").hide();
		$("#original").hide();
	});
</%def>

<div id="toolbox">
	<input type="file" id="input">
	<input id="process" type="button" value="process">
	<span id="original">
	show original
	<input id="showoriginal" type="checkbox" checked="yes">
	</span>
</div>

<canvas id="canvas2" width="900" height="60">
    This text is displayed if your browser does not support HTML5 Canvas.
</canvas>
