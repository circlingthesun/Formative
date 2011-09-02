<html>
<body>

<form action="${request.resource_url(request.context, 'upload')}" method="post" enctype="multipart/form-data">
${renderer.csrf_token()}
    ${renderer.errorlist("f")}
    <label for="f">Filename:</label>
    <input type="file" name="f" id="f" /> 
    <br />
${renderer.submit("submit", "Save")}
</form>

</body>
</html>
