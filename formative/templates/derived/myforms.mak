<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />

<%def name="script_section()">
	${parent.script_section()}
	function SelectAll(id) {
	    document.getElementById(id).focus();
	    document.getElementById(id).select();
	}
</%def>

<div class="grid_12">
<h2>My Forms</h2>
<hr />
</div>
% if forms.count() > 0:
	<% i = 0 %>
	<% paginator = h.Page(forms, request, 10, "c") %>
	${paginator.pager() | n}
	% for form in paginator.getslice():
		<div class="grid_9">

		<h3><a href="/form/${form['label']}">${form['title']}</a></h3>

		<a href="/form/${form['label']}/submissions">
			view submissions
		</a>
		|
		<a href="/form/${form['label']}/del">
		delete
		</a>
		<br /><br />

		<strong>Link to form</strong>
		<br/>
		<input id="link${i}" type="textfield" size="60" onclick="SelectAll('link${i}');" value="${request.application_url}/form/${form['label']}">
		<br />
		<br />
		<strong>Mobile link to form</strong>
		<br/>
		<input id="mlink${i}" type="textfield" size="60" onclick="SelectAll('mlink${i}');" value="${request.application_url}/mform/${form['label']}">
		<br /><br />
		</div>
		<div class="grid_3">
			<a href="${request.application_url}/form/${form['label']}/qr.png">
			<img src="${request.application_url}/form/${form['label']}/qr.png" width="205" height="205" class="qr"/>
			</a>
		</div>
		<hr class="grid_12" />
		<% i = i+1 %>
	% endfor
	${paginator.pager() | n}
% else:
	<div class="grid_12">
	<strong>No forms found. Perhaps create one and come back.</strong>
	</div>
% endif
</div>