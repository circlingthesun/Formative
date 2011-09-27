<%! from pyramid.security import authenticated_userid %>

<%inherit file="/base/base.mak" />
<%def name="account()">
    ${renderer.begin(request.resource_url(request.root, 'account'))}
    ${renderer.csrf_token()}
    <div class="field">
      Email <br />
        ${renderer.errorlist("email")}
        ${renderer.text("email", size=60)}
    </div>

    <div class="field">
      Password <br />
        ${renderer.errorlist("password")}
        ${renderer.password("password", size=60)}
    </div>
    <div class="buttons">
        ${renderer.submit("submit", "Save")}
    </div>
    ${renderer.end()}
</%def>

<div class="grid_12">
<h2>Account Settings</h2>
<p>Change your email or password</p>
${account()}
</div>