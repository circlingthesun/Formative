<%inherit file="/base/base.mak" />

<%def name="script_section()">
	${parent.script_section()}
	function SelectAll(id) {
	    document.getElementById(id).focus();
	    document.getElementById(id).select();
	}
</%def>

<div class="grid_12">
<h2>Your form was created.</h2>

<strong>Link to your form</strong>
<br/>
<input id="link" type="textfield" size="60" onclick="SelectAll('link');" value="${request.application_url}/form/${form['label']}">
<br />
<br />
<strong>Mobile link to your form</strong>
<br/>
<input id="mlink" type="textfield" size="60" onclick="SelectAll('mlink');" value="${request.application_url}/mform/${form['label']}">
<br />
<br />
<a href="/form/${form['label']}">View your new form</a>
<br />
<a href="/myforms">View all your forms</a>
<br/>
</div>