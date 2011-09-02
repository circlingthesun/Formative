<%inherit file="/base/base.mak" />

<%def name="right_col()">
        right col
</%def>

<%def name="header()">
    <h2 class="title"></h2>
</%def>

<!-- begin content -->
<div id="middle">
   ${self.header()}
   ${next.body()}
</div>
<!-- end content-->
<div id="right">
    ${self.right_col()}
</div>
