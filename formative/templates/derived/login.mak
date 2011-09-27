<%inherit file="/base/base.mak" />
<%def name="login()">
    ${renderer.begin(request.resource_url(request.root, 'login'))}
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
        ${renderer.submit("submit", "Login")}
    </div>
    ${renderer.end()}
</%def>

<%def name="smalllogin()">
    ${renderer.begin(request.resource_url(request.root, 'login'))}
    ${renderer.csrf_token()}
    <div class="field">
      Username <input name="email" type="text"/>
    </div>

    <div class="field">
      Password <br />
        <input name="password" type="password"/>
    </div>
    <div class="buttons">
        ${renderer.submit("submit", "Login")}
    </div>
    ${renderer.end()}
</%def>

<div class="grid_12">
<h2>Login</h2>
${login()}
<a href="/forgot-password">Forgot your password?</a>
</div>
