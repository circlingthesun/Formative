<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />
<%namespace name="form" file="/components/form.mak"/>
<div class="grid_12 top_margin_10">
% for form in forms:
	<a href="/form/${form['label']}">${form['label']}</a> view submissions | delete<br />
% endfor
</div>