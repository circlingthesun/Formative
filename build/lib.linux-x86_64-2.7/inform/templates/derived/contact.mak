<%inherit file="/base/twocol.mak" />

<%def name="right_col()">
    <p style="text-align:center;"><img alt="stamp" src="/static/images/stamp.jpg"></p>
</%def>

<%def name="header()">
    <h2 class="title">Contact us</h2>
</%def>

<%def name="title()">Contact us</%def>

${renderer.begin(request.resource_url(request.root, 'contact'))}
${renderer.csrf_token()}

<div class="field">
    Subject
    ${renderer.errorlist("subject")}<br />
    ${renderer.text("subject", size=30)}
</div>

<div class="field">
    Name
    ${renderer.errorlist("name")}<br />
    ${renderer.text("name", size=30)}
</div>

<div class="field">
    Email
    ${renderer.errorlist("email")}<br />
    ${renderer.text("email", size=30)}
</div>

<div class="field">
    
    Message
    ${renderer.errorlist("message")}<br />
    ${renderer.textarea("message", rows=20, cols=67)}
</div>

<div class="buttons">
    ${renderer.submit("submit", "Send")}
</div>
${renderer.end()}
