<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />


<%def name="js()">
    ${parent.js()}
    ${self.js_link("/static/js/jquery-1.6.2.min.js")}
    ${self.js_link("/static/js/formative.js")}
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
		$("#process").toggle();
	});
</%def>

<input type="file" id="input">
<input id="process" type="button" value="process">
<canvas id="canvas2" width="900" height="600">
    This text is displayed if your browser does not support HTML5 Canvas.
</canvas>
