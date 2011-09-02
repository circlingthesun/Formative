import os

from pyramid.view import view_config
from pyramid.exceptions import NotFound
from pyramid.exceptions import Forbidden
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound

from pyramid_mailer.message import Message
from pyramid_mailer.message import Attachment

from formencode import Schema, validators
from formencode.schema import SimpleFormValidator

from pyramid_simpleform import Form
from pyramid_simpleform import State
from pyramid_simpleform.renderers import FormRenderer

from pyramid.security import remember
from pyramid.security import forget

from formative.security import authenticate

import formative_cv
import Image, StringIO
from datetime import datetime

class FormSchema(Schema):
    """
    Schema for contact form
    """
    filter_extra_fields = True
    allow_extra_fields = True
    file = validators.FieldStorageUploadConverter
    # boxes = validators.String()


@view_config(context='formative:resources.Root',
                    renderer='/derived/create.mak',
                    name="create")
def form_new(request):
    form = Form(request, schema=FormSchema)
    return {"renderer":FormRenderer(form)}


@view_config(context='formative:resources.Root',
                    renderer='/derived/verify.mak',
                    name="verify")
def form_verify(request):
    form = Form(request, schema=FormSchema)
    box_list = []
    if form.validate():
        
        d = form.data
        img_file = form.data['file'].file
        img = Image.open(img_file)
        raw_img = img.convert('RGB').tostring()
        #boxes = eval(d['boxes']) # Very bad security hole
        
        # Process
        box_list, raw_img, w, h = formative_cv.parse(raw_img, img.size[0], img.size[1])
        img = Image.fromstring("RGB", (w, h), raw_img, "raw", "BGR", 0, 1)
        print box_list
        #print box_list;
        
        # Save
        output = StringIO.StringIO()
        img.save(output, format="JPEG")
        filename = datetime.now().strftime("%Y%m%d%H%S") + ".jpg"
        file_id = request.fs.put(output.getvalue(), filename=filename, content_type="image/jpeg")
        output.close()
        
    if form.errors:
        request.session.flash('There are errors in your form. %s' % str(form.errors), queue='error')
        return HTTPFound(location="/create")
    
    url = '/file/%s' % filename;
    
    return {"renderer":FormRenderer(form), 'img_url':url, 'box_list':box_list}
