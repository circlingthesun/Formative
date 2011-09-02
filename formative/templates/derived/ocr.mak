<%! from pyramid.security import has_permission %>
<%inherit file="/base/base.mak" />

<h3>OCR text:</h3>
% for i in range(len(ocr)):
    Box ${boxes[i]} :${unicode(ocr[i], errors='ignore')} <br />
% endfor
    
