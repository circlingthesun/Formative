<%inherit file="/base/base.mak" />
<div class="grid_12">
<h2>Submissions of <a href="/myforms">${form['title']}</a></h2>
% if submissions.count() > 0:
	<% paginator = h.Page(submissions, request, 10, "c") %>

	<a href="/form/${form['label']}/csv">Export to CSV</a><br /><br />

	${paginator.pager() | n}
	<div class="scroll">
	<table border="1">
		<thead><tr>
			<th>Timestamp</th>
			% for item in items:
			<th>${item[1]}</th>
			% endfor
		</tr></thead>
	% for sub in paginator.getslice():
		<tr>
			<td>
				<!--<a href="${request.path_url}/${str(sub['_id'])}"> -->
					${sub['timestamp'].strftime('%Y-%m-%d %H:%M')}
				<!-- </a>-->
			</td>
			% for item in items:
			<td>${sub['fields'][item[0]]}</td>
			% endfor
		</tr>
	% endfor
	</table>
	</div>
	${paginator.pager() | n}
% else:
	<strong>It looks like no one has filled out your form yet.</strong>
% endif
</div>