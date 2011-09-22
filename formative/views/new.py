import os
import json
import base64
from datetime import datetime
import StringIO

import Image

from pyramid.view import view_config
from pyramid.exceptions import NotFound
from pyramid.exceptions import Forbidden
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound, HTTPBadRequest

from pyramid_mailer.message import Message
from pyramid_mailer.message import Attachment

from pymongo.objectid import ObjectId

from pyramid.security import remember
from pyramid.security import forget

from formative.security import authenticate

import formative_cv



@view_config(context='formative:resources.Root',
                    renderer='/derived/new.mak',
                    name="new")
def new(request):
    return {"csrf":request.session.get_csrf_token()}


@view_config(context='formative:resources.Root',
                    name="process",
                    renderer='json',
                    xhr=True
                    )
def process(request):
    data = request.POST

    data['file'] = data['file'].replace('data:image/png;base64,', '')
    img_file = StringIO.StringIO(base64.decodestring(data['file']))
    img = Image.open(img_file)

    raw_img = img.convert('RGB').tostring()
    
    features = formative_cv.process(raw_img, img.size[0], img.size[1])
    img = Image.fromstring("RGB", (img.size[0], img.size[1]), raw_img,
            "raw", "BGR", 0, 1)
        
    with open('json.txt', 'w') as out:
        out.write(json.dumps(features, indent=4))

    return features


@view_config(context='formative:resources.Root',
                    name="preview",
                    renderer='/components/form.mak',
                    xhr=True
                    )
def preview(request):
    result = json.loads(request.POST['features'])
    data = parse(result)
    return {"data":data}

@view_config(context='formative:resources.Root',
                    name="finalise",
                    renderer='json',
                    xhr=True
                    )
def finalise(request):
    result = json.loads(request.POST['features'])
    data = parse(result)
    _id = request.db.formschemas.save({"items":data})
    return {'id':str(_id)}


@view_config(context='formative:resources.Root',
                    renderer='/derived/form.mak',
                    name="form")
def view_form(request):
    formid = request.GET['id']
    data = request.db.formschemas.find_one(_id=ObjectId(formid));
    if not data:
        data = {"items":[]}
    return {"data":data['items'], "csrf":request.session.get_csrf_token()}

def parse(data):
    

    # New representation
    items = []

    agregate_font = 0
    text_items = 0
    max_height = 0

    # Add labels to boxes and discard any
    # non labeled boxes
    for key, value in data.items():
        # Bind labels to boxes
        item = None
        if value['type'] == 'LABEL':
            item = data[str(value['target'])]
            item['y'] = value['y']
            item['h'] = value['h']
            item['label'] = value['val']
            item['name'] = base64.b64encode(value['val'])
        elif value['type'] == 'TEXT':
            item = value
            item['is_title'] = False
            agregate_font = item['h'] + agregate_font
            text_items = text_items + 1
            if item['h'] > max_height:
                max_height = item['h']
        if item:
            item['x'] = int(item['x'])
            item['y'] = int(item['y'])
            item['w'] = int(item['w'])
            item['h'] = int(item['h'])
            items.append(item)

    # iterate over and set font size
    #for item in items:
    #    if item['h']

    # negative for smaller
    # is a smaller than b
    def compare(a, b):
        delta_y = abs(a['y'] - b['y'])
        mean_h = (a['h']+b['h'])/2
        # if they are on about the same level
        if delta_y < mean_h:
            return  a['x'] - b['x']
        else:
            return a['y'] - b['y']

    items = sorted(items, cmp=compare)

    # try set title
    if items[0]['h'] > agregate_font/text_items:
        items[0]['is_title'] = True
   
    return items
    
