<%! from pyramid.security import authenticated_userid %>

<%inherit file="/base/base.mak" />
<%def name="forgot()">
    ${renderer.begin(request.resource_url(request.root, 'forgot-password'))}
    ${renderer.csrf_token()}
    <div class="field">
      Email <br />
        ${renderer.errorlist("email")}
        ${renderer.text("email", size=60)}
    </div>

    <div class="buttons">
        ${renderer.submit("submit", "Help me remember")}
    </div>
    ${renderer.end()}
</%def>

<div class="grid_12">
<h2>Forgotten password</h2>
${forgot()}
</div>