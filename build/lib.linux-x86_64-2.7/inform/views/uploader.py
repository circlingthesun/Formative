from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound

from formencode import Schema, validators
from pyramid_simpleform import Form
from pyramid_simpleform.renderers import FormRenderer

from pyramid.response import Response

from datetime import datetime

import os.path

import Image
import cStringIO

class FileSchema(Schema):
    filter_extra_fields = True
    allow_extra_fields = True
    f = validators.FieldStorageUploadConverter

@view_config(context='formative:resources.Root',
                    renderer='/components/fileuploader.mak',
                    name="upload",
                    permission='edit')
def file_upload(request):
    form = Form(request, schema=FileSchema)
    
    if form.validate():
        field = form.data['f']
        request.fs.put(field.file, filename=field.filename, content_type=field.type)
        request.session.flash('Upload of "%s" succeeded.' % field.filename, queue='info')
        return HTTPFound(location = request.resource_url(request.context))
    elif form.errors:
        request.session.flash('Upload failed.', queue='info')
    
    return {"renderer":FormRenderer(form)}


class ImgSchema(Schema):
    filter_extra_fields = True
    allow_extra_fields = True
    f = validators.FieldStorageUploadConverter(not_empty=True, messages={'empty':'Please select a file.'})
    size = validators.Int(not_empty=True, messages={'missing':'Please select a size.'})
    callback = validators.String()


@view_config(context='formative:resources.Root',
                    renderer='/components/imguploader.mak',
                    name="imgupload",
                    permission='edit')
def img_upload(request):
    form = Form(request, schema=ImgSchema)

    callback = '2' # default
    
    if request.method == 'GET' and 'CKEditorFuncNum' in request.GET:
        callback = request.GET['CKEditorFuncNum']
    
    if form.validate():
        field = form.data['f']
        callback = form.data['callback']
        
        size = form.data['size'], form.data['size']
        thumbnail_size = (96,96)
        filename, ext = extension = os.path.splitext(field.filename)
        new_filename = ''.join([filename, datetime.now().strftime("%Y%m%d%H%S") , "_" , str(size[0]) , 'x' ,str(size[1])])
        file_id = None
        thumbnail_id = None
        
        # If image has to be resized
        if form.data['size'] != 0:
            ext = ".jpg"
            output = cStringIO.StringIO()
            im = Image.open(field.file)
            im.thumbnail(size, Image.ANTIALIAS)
            im.save(output, "JPEG")
            file_id = request.fs.put(output.getvalue(), filename=new_filename + ext, content_type="image/jpeg")
            output.close()     
        else:
            file_id = request.fs.put(field.file, filename=new_filename + ext, content_type=field.type)
        
        # Create thumbnail
        output = cStringIO.StringIO()
        field.file.seek(0)
        im = Image.open(field.file)
        im.thumbnail(thumbnail_size, Image.ANTIALIAS)
        im.save(output, "JPEG")
        thumbnail_filename = new_filename + '_thumb.jpg'
        file_id = request.fs.put(output.getvalue(), filename= thumbnail_filename, content_type="image/jpeg")
        output.close()
        
        
        # Keep track of uploaded images
        request.db.images.save({'filename':new_filename + ext, 'file_id':file_id, 'thumbnail_filename':thumbnail_filename, 'thumbnail_id':thumbnail_id})
        
        url = request.resource_url(request.root ) + 'file/%s' % new_filename + ext
        response = Response()
        response.unicode_body = u'<html><body><script type="text/javascript">window.opener.CKEDITOR.tools.callFunction(%s, "%s"); window.close();</script></body></html>' % (callback, url)
        response.status_int = 200
        return response
        
    elif form.errors:
        request.session.flash('Upload failed.', queue='info')
    
    return {"renderer":FormRenderer(form), 'callback':callback}


@view_config(context='formative:resources.Root',
                    name="imgdelete",
                    permission='edit',
                    request_method='POST',
                    request_param='file',
                    xhr=True,
                    )
def img_delete(request):
    response = Response()
    filename = request.POST['file']
    fileinfo = request.db.images.find_one({'filename':filename})
    request.fs.delete(fileinfo['file_id'])
    request.fs.delete(fileinfo['thumbnail_id'])
    request.db.images.remove(fileinfo)
    response.status_int = 200
    response.body = 'Success'
    return response
