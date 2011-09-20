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

@view_config(context='formative:resources.Root',
                    renderer='/derived/create.mak',
                    name="create")
def create(request):
    form = Form(request)
    return {"csrf":request.session.get_csrf_token()}


@view_config(context='formative:resources.Root',
                    name="process",
                    renderer='json',
                    xhr=True
                    )
def process(request):
    #print "hai"

    data = request.POST

    data['file'] = data['file'].replace('data:image/png;base64,', '')
    img_file = StringIO.StringIO(base64.decodestring(data['file']))
    img = Image.open(img_file)

    #img.save("see.jpg", "JPEG")
    raw_img = img.convert('RGB').tostring()
    
    features = formative_cv.process(raw_img, img.size[0], img.size[1])
    img = Image.fromstring("RGB", (img.size[0], img.size[1]), raw_img,
            "raw", "BGR", 0, 1)
        
    #return HTTPBadRequest();
    #print "kthxbye"

    with open('json.txt', 'w') as out:
        out.write(json.dumps(features, indent=4))

    return features


@view_config(context='formative:resources.Root',
                    name="parse",
                    renderer='json',
                    xhr=True
                    )
def parse(request):
    #print "hai"
    pass;