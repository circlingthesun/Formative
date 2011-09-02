<%inherit file="/base/twocol.mak" />

<%def name="title()">${action[0].upper()+action[1:]} page</%def>

<%def name="header()">
    <h2 class="title">${action[0].upper()+action[1:]} page</h2>
</%def>

<%def name="right_col()"></%def>

<%def name="js()">
    ${parent.js()}
    ${self.js_link('/static/ckeditor/ckeditor.js')}
</%def>

<%def name="script_section()">
    ${parent.script_section()}
    
    $(function() {
        CKEDITOR.replace( 'body', {
        
        toolbar : 'coltoolbar',
                
        });
    });
    
</%def>

${renderer.begin(request.resource_url(request.context, action))}
    ${renderer.csrf_token()}
        
    <strong>Title: </strong>
    ${renderer.errorlist("title")}<br />
    ${renderer.text("title", size=70)}<br />

    <strong>Link name: </strong>
    ${renderer.errorlist("name")}<br />
    ${renderer.text("name", size=20)}<br />

    <strong>Type: </strong>
    ${renderer.errorlist("type")}<br />
    ${renderer.select(name = "type",  selected_value='', options=[('', 'Select'), ('story', 'Story'), ('page', 'Page')])}<br />

    <strong>Body: </strong>
    ${renderer.errorlist("body")}<br />
    ${renderer.textarea(name='body', id="body", rows=20, cols=70)}<br />
    
    <strong>Published:</strong>
    ${renderer.errorlist("published")}
    ${renderer.checkbox("published")}
    <br />
    <strong>Frontpage:</strong>
    ${renderer.errorlist("frontpage")}
    ${renderer.checkbox("onfrontpage")}
    <br />
    
    <strong>Tags: </strong>
    ${renderer.errorlist("tags")}<br />
    ${renderer.text("tags", size=70)}<br />

    ${renderer.submit("submit", "Save")}
${renderer.end()}
