<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />

<%def name="header()">
    <h2 class="title">Create new form</h2>    
</%def>

<%def name="title()">Create new form</%def>

<%def name="js()">
    ${parent.js()}
</%def>

<%def name="css()">
    ${parent.css()}
</%def>

<%def name="style_section()">
    ${parent.style_section()}
</%def>

<%def name="style_section()">
    ${parent.style_section()}
</%def>

<form id="imgform" name="imgform" action="/verify" method="post" enctype="multipart/form-data">
${renderer.csrf_token()}
<input id="file" name="file" type="file" />
<input id="submit" value="Submit" type="submit"/>
</form>
