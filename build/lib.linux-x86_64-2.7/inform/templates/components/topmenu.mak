<%! from pyramid.security import authenticated_userid %>

<%def name="make_menu(menu_list, ul_class = None)" >
    % if ul_class:
    <ul class="${ul_class}">
    % else:
    <ul>
    % endif
        % for item in menu_list:
            <li>
            % if "url" in item[1]:
                <a href='${item[1]['url']}'>${item[0]}</a>
            % else:
                <a href='#'>${item[0]}</a>
            % endif
            % if "children" in item[1]:
                ${make_menu(item[1]['children'])}
            % endif
            </li>
        % endfor
    </ul>
</%def>

<%def name="topmenu(ul_class)">
        
    <%
        menu = [
            ["Create a form", {
                "url" : "/create",
            }],
        ]
        
        if authenticated_userid(request):
            menu.append(
                ["Logout", {
                    "url" : "/logout",
                }]
            )
        else:
            menu.append(
                ["Login", {
                    "url" : "/login",
                }]
            )
    %>
    
    ${make_menu(menu, ul_class)}
</%def>

<%def name="css(parent)">
	${parent.css_link('/static/css/superfish.css', 'screen')}
</%def>

<%def name="js(parent)">
	${parent.js_link('/static/js/jquery-1.6.2.min.js')}
	${parent.js_link('/static/js/jquery.hoverIntent.minified.js')}
	${parent.js_link('/static/js/superfish.js')}
</%def>

<%def name="script_section()">
    // initialise plugins
    jQuery(function(){
        jQuery('ul.sf-menu').superfish();
    });
</%def>

<%def name="style_section()">

</%def>
