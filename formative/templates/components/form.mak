<%def name="form()">

% for item in data:
    % if item['type'] == 'TEXT':
    	% if item['is_title']:
    		<h1>${item['val']}</h1>
    	% else:
        	<div>${item['val']}</div>
        % endif
    % elif item['type'] == 'CHECKBOX':
        <div>
        <input type="checkbox" name="item['name']"/>
        ${item['label']}
        </div>
    % elif item['type'] == 'TEXTBOX':
        <div>${item['label']}<br/>
        <input type="textbox" name="item['label']" size="${item['w']/item['h']}"/>
        </div>
    % endif
    
% endfor
<input type="submit" name="Submit"/>
</%def>

${form()}
