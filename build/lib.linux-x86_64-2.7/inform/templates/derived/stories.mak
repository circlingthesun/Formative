<%! from pyramid.security import has_permission %>
<%inherit file="/base/twocol.mak" />

<%
    stories = 0
    pages = request.db.pages.find({'type':'story'}, sort=[("created",-1)])
    paginator = h.Page(pages, request, 5)
%>

% for story in paginator.getslice():
    <%
        if not has_permission('edit', request.context, request) and not story['published']:
            continue
        stories = stories + 1
    %>
    <div class="curriculum">
    <h3>${h.link_to(story['title'], "/stories/%s" % story['name'])}
    % if not story['published']:
        (Unpublished)
    % endif
    </h3>
    <div>
    ${h.textilize( " ".join([story['body'] , h.link_to('Read more', "/stories/%s" % story['name']),]) ) | n }
    </div>
    </div>
% endfor


% if not stories:
    No stories at this time
% endif

</br>
${paginator.pager() | n}

<%def name="title()">Stories</%def>

<%def name="header()">
    <h2 class="title">Stories</h2>
    % if has_permission('edit', request.context, request):
        <div class="edit_links"><a href="${request.path_url + '/new'}">Create new story</a></div>
    % endif
</%def>
