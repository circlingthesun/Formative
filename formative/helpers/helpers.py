from webhelpers.html.converters import *
from webhelpers.html.tags import *
from webhelpers.constants import *
from math import ceil

paragraphize = textilize

class Page(object):
    def __init__(self, collection, request, page_size=10):
        self.page_no = 1
        try:
            self.page_no = int(request.params.get('p', 1))
        except:
            pass  
        self.page_size = page_size
        self.collection = collection
        self.url = request.path_url
        self.no_pages = ceil((collection.count()+0.5)/page_size)
    
    def getslice(self):
        return self.collection[(self.page_no-1)*self.page_size:(self.page_no)*self.page_size]
    
    def pager(self):
        link = self.url + "?p=%d"
        next = ""
        previous = ""
        if self.page_no < self.no_pages:
            next = link_to("next", link%(self.page_no+1))
        if self.page_no != 1:
            previous = link_to("previous", link%(self.page_no-1))
            
        return "<div>%s %s</div>"% (previous, next)
