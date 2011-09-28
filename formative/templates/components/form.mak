<%def name="form()">

% for item in data:

    % if item['type'] == 'TEXT':
    	% if item['is_title']:
    		<h2>${item['val']}</h2>
    	% else:
        	<div>${item['val']}</div>
        % endif
    % elif item['type'] == 'CHECKBOX':
        <%
            checked = ''
            if item['name'] in filled and filled[item['name']] == "yes":
                checked = 'checked="yes"'
        %>
        <div>
        <input type="checkbox" ${checked | n} name="${item['name']}" value="yes"/>
        ${item['label']}
        </div>
    % elif item['type'] == 'TEXTBOX':
        <%
            value = ''
            if item['name'] in filled:
                value = 'value="%s"' % filled[item['name']]
        %>
        <div>${item['label']}<br/>
        % if item['name'] in errors:
            <div class="error">${errors[item['name']]}</div>
        % endif
        <input type="textbox" ${value | n} name="${item['name']}"
                size="${item['w']/item['h']}"/>
        </div>
    % endif
    
% endfor
</%def>

${form()}
<input type="submit" name="Submit"/>
