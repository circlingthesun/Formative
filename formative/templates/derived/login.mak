<%inherit file="/base/base.mak" />
<%def name="login()">
    ${renderer.begin(request.resource_url(request.root, 'login'))}
    ${renderer.csrf_token()}
    <div class="field">
      Email <br />
        ${renderer.errorlist("username")}
        ${renderer.text("username", size=60)}
    </div>

    <div class="field">
      Password <br />
        ${renderer.errorlist("password")}
        ${renderer.password("password", size=60)}
    </div>
    <div class="buttons">
        ${renderer.submit("submit", "Submit")}
    </div>
    ${renderer.end()}
</%def>

<%def name="smalllogin()">
    ${renderer.begin(request.resource_url(request.root, 'login'))}
    ${renderer.csrf_token()}
    <div class="field">
      Username <input name="username" type="text"/>
    </div>

    <div class="field">
      Password <br />
        <input name="password" type="password"/>
    </div>
    <div class="buttons">
        ${renderer.submit("submit", "Submit")}
    </div>
    ${renderer.end()}
</%def>

<div class="grid_12">
${login()}
</div>
