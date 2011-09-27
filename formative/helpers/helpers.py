from webhelpers.html.converters import *
from webhelpers.html.tags import *
from webhelpers.constants import *
from math import ceil

paragraphize = textilize

class Page(object):
    def __init__(self, collection, request, page_size=10, param='p'):
        self.param = param
        self.page_no = 1
        try:
            self.page_no = int(request.params.get(param, 1))
        except:
            pass  
        self.page_size = page_size
        self.collection = collection
        self.url = request.path_url
        self.qs = request.query_string

        self.no_pages = 0
        try:
            self.no_pages = (collection.count()/float(page_size))
        except:
            self.no_pages = (len(collection)/float(page_size))
    
    def getslice(self):
        return self.collection[(self.page_no-1)*self.page_size:(self.page_no)*
                self.page_size]
    
    def pager(self, prev_text="Previous", next_text="Next"):
        link = self.url + "?"
        if self.qs:
            qs = [ val for val in self.qs.split("&") if val[len(self.param)-1] != self.param]
            link = link + "&".join(qs)

        link = link + self.param + "=%d"
        next = ""
        previous = ""

        if self.page_no < self.no_pages:
            next = link_to(next_text, link%(self.page_no+1))
        if self.page_no != 1:
            previous = link_to(prev_text, link%(self.page_no-1))
            
        return '''<div class="paginator">
                <span class="p_left">%s</span> <span class="p_right">%s</span>
                </div>'''% (previous, next)
