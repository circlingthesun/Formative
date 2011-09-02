<%! from pyramid.security import has_permission %>
<%inherit file="/base/twocol.mak" />

<%def name="meta()">
        <meta name="keywords" content="${", ".join(page['tags'])}" />
</%def>

<%def name="header()">
    <h2 class="title">${page['title']}</h2>
    % if has_permission('edit', request.context, request):
        <div class="edit_links">
        <a href="${request.path_url + '/edit'}">Edit</a>
        | <a href="${request.path_url + '/del'}">Delete</a>
        </div>
    % endif
    
</%def>

<%def name="title()">${page['title']}</%def>

${h.textilize(page['body']) | n}
