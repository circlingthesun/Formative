<%inherit file="/base/base.mak" />
<div class="grid_12">
<h2>Submissions of Form ${form['label']}</h2>
% if submissions.count() > 0:
	<a href="/form/${form['label']}/csv">Export to CSV</a><br /><br />
	<table border="1">
		<thead><tr>
			<th>Timestamp</th>
			<th></th>
		</tr></thead>
	% for sub in submissions:
		<tr>
			<td>
			<a href="/form/${str(sub['_id'])}">${sub['timestamp'].strftime('%Y-%m-%d %H:%M')}</a>
			</td>
			<td>
			 view | delete<br />
			</td>
		</tr>
	% endfor
	</table>
% else:
	<strong>It looks like no one has filled out your form yet.</strong>
% endif
</div>