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

<%def name="right_col()">    

<p>
<img alt="unisa" src="/static/images/unisa.jpg">
</p>
<br />

<iframe src="http://www.facebook.com/plugins/likebox.php?id=141110852575588&amp;width=292&amp;connections=10&amp;stream=false&amp;header=true&amp;height=287" style="border:none; overflow:hidden; width:292px; height:287px;"></iframe>
                
</%def>
<img style="float:right;padding:10px;" src="/static/images/fluffy.jpg"/>
Fluffy welcomes you to to Formative.<br />
You can <a href="/static/testform.zip">download this</a> form and try convert it by clicking the "Create Form" link above.

<!-- home.mak -->

<%
    pages = request.db.pages.find({"published":True, "onfrontpage": True}, sort=[("created",-1)])
    paginator = h.Page(pages, request, 5)
%>

% for page in paginator.getslice():
    
    <div class="node">
        <h2><a href="/pages/${page['name']}">${page['title']}</a></h2>
        <div class="page">
            ${h.paragraphize(page['body']) | n}
        </div>        	
    </div>
% endfor

${paginator.pager() | n}
<!-- end home.mak -->
