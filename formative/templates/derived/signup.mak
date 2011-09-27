<%! from pyramid.security import authenticated_userid %>

<%inherit file="/base/base.mak" />
<%def name="signup()">
    ${renderer.begin(request.resource_url(request.root, 'signup'))}
    ${renderer.csrf_token()}
    <div class="field">
      Email <br />
        ${renderer.errorlist("email")}
        ${renderer.text("email", size=60)}
    </div>

    <div class="buttons">
        ${renderer.submit("submit", "Sign up")}
    </div>
    ${renderer.end()}
</%def>

<div class="grid_12">
<h2>Sign up</h2>
${signup()}
</div>