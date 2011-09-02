<%inherit file="/base/twocol.mak" />

<%def name="title()">Delete "${item}"?</%def>

<%def name="header()">
    <h2 class="title">Are you sure you want to delete "${item}"?</h2>
</%def>

<%def name="right_col()"></%def>

${renderer.begin(request.resource_url(request.context, 'del'))}
${renderer.csrf_token()}
${renderer.submit("cancel", "Cancel")}
${renderer.submit("delete", "Delete")}
${renderer.end()}
