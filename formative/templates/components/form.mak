<%def name="form()">

% for item in data:
    % if item['type'] == 'TEXT':
    	% if item['is_title']:
    		<h2>${item['val']}</h2>
    	% else:
        	<div>${item['val']}</div>
        % endif
    % elif item['type'] == 'CHECKBOX':
        <div>
        <input type="checkbox" name="${item['name']}" value="yes"/>
        ${item['label']}
        </div>
    % elif item['type'] == 'TEXTBOX':
        <div>${item['label']}<br/>
        <input type="textbox" name="${item['name']}" size="${item['w']/item['h']}"/>
        </div>
    % endif
    
% endfor
</%def>

${form()}
<input type="submit" name="Submit"/>
