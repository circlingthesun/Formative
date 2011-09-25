<%inherit file="/base/base.mak" />

<%def name="meta()">
        <meta name="description" content="Translate paper forms into web forms." />
        <meta name="keywords" content="forms" />
</%def>

<%def name="js()">
    ${parent.js()}
</%def>

<%def name="css()">
    ${parent.css()}
</%def>

<%def name="script_section()">
    ${parent.script_section()}
</%def>

<%def name="style_section()">
    ${parent.style_section()}
</%def>

<%def name="title()">Home</%def>

<!-- home.mak -->
<div id="start">
    <div class="grid_3">
        <img src="/static/images/form.png">
        <p>Load your form</p>
    </div>
    <div class="grid_3">
        <img src="/static/images/cloudUp.png">
        <p>Process in cloud</p>
    </div>
    <div class="grid_3">
        <img src="/static/images/pensil.png">
        <p>Edit (a.k.a fix magic cloud mistakes)</p>
    </div>
    <div class="grid_3">
        <img src="/static/images/users.png">
        <p>Finalise &amp share</p>
    </div>
</div>

<!-- end home.mak -->
