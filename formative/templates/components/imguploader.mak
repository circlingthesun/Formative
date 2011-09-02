<html>

<head>

<script type="text/javascript" src="/static/js/jquery-1.6.2.min.js"></script>
<script type="text/javascript">
    function goto(filename){
        var url = "${request.resource_url(request.root ) + 'file/'}" + filename;
        window.opener.CKEDITOR.tools.callFunction(${callback}, url);
        window.close();
    }
    
    function delimg(filename){
        var csrf = "${request.session.get_csrf_token()}";
        var url = "${request.resource_url(request.root ) + 'imgdelete'}";
        $.post(url, { file: filename, _csrf: csrf }, function( data ) {window.location.reload();});
    }
</script>

</head>

<body>

<form action="${request.resource_url(request.context, 'imgupload')}" method="post" enctype="multipart/form-data">
    <fieldset>
    <legend>Upload new image</legend>
    ${renderer.csrf_token()}
    ${renderer.hidden(name="callback", value=callback)}
    ${renderer.errorlist()}
    ${renderer.label(name="f", label="Image: ")}
    ${renderer.file(name="f")}
    ${renderer.label(name="size", label="Size")}
    ${renderer.radio("size", value="250", checked=False, label="250x250")}
    ${renderer.radio("size", value="350", checked=False, label="350x350")}
    ${renderer.radio("size", value="500", checked=False, label="500x500")}
    ${renderer.radio("size", value="0", checked=False, label="No resizing")}
    ${renderer.submit("submit", "Upload")}
    </fieldset>
</form>

    <fieldset>
    <legend>Select existing picture</legend>
    % for img in request.db.images.find(): # {"tags" : {"$in": ["image"]}}
        <a onclick="goto('${img['filename']}');" href="#" >
        <img src="${request.resource_url(request.root ) + 'file/' + img['thumbnail_filename']}" alt="thumbnail" />
        </a>
        <a onclick="delimg('${img['filename']}');" href="#" >
        Delete
        </a>
        <br />
    % endfor
    
    </fieldset>

</body>
</html>
