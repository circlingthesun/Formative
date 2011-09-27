<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />
<%namespace name="form" file="/components/form.mak"/>
<div class="grid_12">
<h2>My Forms</h2>
% if forms.count() > 0:
	% for form in forms:
		<a href="/form/${form['label']}">${form['label']}</a> view submissions | delete<br />
	% endfor
% else:
	<strong>No forms found. Perhaps create one and come back.</strong>
% endif
</div>