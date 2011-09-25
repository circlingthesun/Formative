<%namespace name="topmenu" file="/components/menu.mak"/>

<%
    self.seen_css = set()
    self.seen_js = set()
%>

<%def name="css_link(path, media='')">
    % if path not in self.seen_css:
        <link rel="stylesheet" type="text/css" href="${path|h}" media="${media}" />
    % endif
    <% self.seen_css.add(path) %>
</%def>

<%def name="js_link(path)">
    % if path not in self.seen_js:
        <script type="text/javascript" src="${path|h}"></script>
    % endif
    <% self.seen_js.add(path) %>
</%def>

<%def name="style_section()">
    ${topmenu.style_section()}
</%def>

<%def name="script_section()">
    ${topmenu.script_section()}
</%def>

<%def name="css()">
    ${css_link('http://fonts.googleapis.com/css?family=Loved+by+the+King', 'screen')}
    ${css_link('http://fonts.googleapis.com/css?family=Hammersmith+One', 'screen')}
    ${css_link('/static/css/reset.css', 'screen')}
    ${css_link('/static/css/960.css', 'screen')}
	${css_link('/static/css/style.css', 'all')}
	${topmenu.css(self)}
</%def>

<%def name="js()">
    ${topmenu.js(self)}
</%def>


<%def name="title()"></%def>
<%def name="footer()">Rickert Mulder 2011</%def>
<%def name="analytics()"></%def>

<%def name="flash()">
    % if request.session.peek_flash('error'):
        <div id="flash-error">
        % for msg in request.session.pop_flash('error'):
            ${msg}
        % endfor
        </div>
    % endif
    % if request.session.peek_flash('info'):
        <div id="flash">
        % for msg in request.session.pop_flash('info'):
            ${msg}
        % endfor
        </div>
    % endif

</%def>

<%def name="toolbox()">

</%def>

<%def name="meta()"></%def>

<!DOCTYPE html>
<html lang="en">
    <head>
        <title>${self.title()} | Formative</title>
        <meta charset="UTF-8" />
        ${self.meta()}
        ${self.css()}
        <style>${self.style_section()}</style>
    </head>

    <body>
		
	    <div id="header">
            <div class="container_12">
	        <h1 id="name" class="grid_2"><a href="/">Formative</a></h1>
            <div id="navigation" class="grid_10">${topmenu.topmenu("menu")}</div>
            </div>
	    </div>

        ${self.toolbox()}

	    <div id="page" class="container_12">
            <div id="content">
            ${self.flash()}
	        ${next.body()}
            </div>
        </div>
	    <!-- end container -->
	    
        <div class="footer" id="footer">
        <div class="container_12">
        <div class="grid_2 prefix_10">
        ${self.footer()}
        </div>
        </div>
        </div>

	    <!-- scripts -->
	    ${self.js()}
        <script type="text/javascript">
            ${self.script_section()}
        </script>
        ${analytics()}
        <!-- end scripts -->
    </body>

</html>
