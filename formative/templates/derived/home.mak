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

    <div class="grid_3 center top_margin_10">
        <img src="/static/images/page.png">
        <p>1. Load your form</p>
    </div>
    <div class="grid_3 center top_margin_10">
        <img src="/static/images/cloudUp.png">
        <p>2. Process in cloud</p>
    </div>
    <div class="grid_3 center top_margin_10">
        <img src="/static/images/pensil.png">
        <p>3. Fix any mistakes</p>
    </div>
    <div class="grid_3 center top_margin_10">
        <img src="/static/images/users.png">
        <p>4. Finalise &amp share</p>
    </div>

    <p class="grid_12">
        Formative is aimed at making it easier for you to convert existing paper
        forms into digital web forms. We achieve this by letting computers do most
        of the boring work for you. However because our computers are not as smart as you,
        they may make some silly mistakes. We therefore let you edit the form and fix
        little mistakes or make additions. When you are happy, we will generate the final
        web form and give you a link to it. We also give you a link that lets you view
        form submissions and export them.
    </p>
        <div class="grid_12 top_margin_10 center">
        <a href="/new">
        <button class="big_button">Get started</button>
        </a>
    </div>




<!-- end home.mak -->
