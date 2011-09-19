<%namespace name="topmenu" file="/components/topmenu.mak"/>

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
	${css_link('/static/css/style.css', 'all')}
    ${css_link('/static/css/reset-min.css', 'screen')}
	${topmenu.css(self)}
</%def>

<%def name="js()">
    ${topmenu.js(self)}
</%def>


<%def name="title()"></%def>
<%def name="footer()">Rickert Mulder 2011</%def>
<%def name="analytics()">

</%def>

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

<%def name="meta()"></%def>

<!DOCTYPE html>
<html lang="en">
    <head>
        <title>${self.title()} | Formative</title>
        <meta charset="UTF-8" />
        ${self.meta()}
        ${self.css()}
        
        <style>
            ${self.style_section()}
        </style>
	
    </head>

    <body>
		
	    <div id="header">
	        <h1 id="name"><a href="/">Formative</a></h1>
	    </div>
	
	    <div id="page">

            <div id="topmenu">
            ${topmenu.topmenu("menu")}
            </div>

            <!-- begin wrapper -->
	        <div id="wrapper">
                ${self.flash()}
                <!-- begin content -->
                ${next.body()}
	            <!-- end content-->
	
            </div>
            <!-- end wrapper -->
            <div class="footer" id="footer">
            ${self.footer()}
            </div>
        </div>
	    <!-- end page -->
	    
	    <!-- scripts -->
	    ${self.js()}
        <script type="text/javascript">
            ${self.script_section()}
        </script>
        ${analytics()}
        <!-- end scripts -->
    </body>

</html>
