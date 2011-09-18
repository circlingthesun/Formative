import os
import json
import base64

from pyramid.view import view_config
from pyramid.exceptions import NotFound
from pyramid.exceptions import Forbidden
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest

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
    Schema for ajax submission
    """
    filter_extra_fields = True
    allow_extra_fields = True
    file = validators.String

@view_config(context='formative:resources.Root',
                    renderer='/derived/create.mak',
                    name="create")
def create(request):
    form = Form(request, schema=FormSchema)
    return {"csrf":request.session.get_csrf_token()}


@view_config(context='formative:resources.Root',
                    name="process",
                    renderer='json',
                    xhr=True
                    )
def process(request):
    print "hai"
    form = Form(request, schema=FormSchema)
    if form.validate():
        form.data['file'] = form.data['file'].replace('data:image/png;base64,', '')
        form.data['file'] = base64.decodestring(form.data['file'])
        img = Image.open(StringIO.StringIO(form.data['file']))
        img.save("see.jpg", "JPEG")
        raw_img = img.convert('RGB').tostring()
        
        features = formative_cv.process(raw_img, img.size[0], img.size[1])
        img = Image.fromstring("RGB", (img.size[0], img.size[1]), raw_img, "raw", "BGR", 0, 1)
        
    if form.errors:
        request.session.flash('There are errors in your form. %s' % str(form.errors), queue='error')
        return HTTPBadRequest()
    print "kthxbye"
    print json.dumps(features, indent=4)
    return features
