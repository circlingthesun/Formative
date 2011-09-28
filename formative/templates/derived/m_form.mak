<%inherit file="/base/mobile.mak" />
<%namespace name="form" file="/components/form.mak"/>
<div class="grid_12 top_margin_10">
<form method="post" action="${request.path_url}">
${form.form()}
<input type="submit" value="Submit">
<input type="hidden" name="_csrf" value="${csrf}">
</form>
</div>
