#include <stdio.h>
#include <math.h>
#include <vector>
#include <iostream>
#include <cv.h>
#include <Python.h>


#include "parse.h"

//#include <baseapi.h>
//#include "leptonica/allheaders.h"
using namespace std;
using namespace cv;

//typedef int(Dict::* tesseract::DictFunc)(void *void_dawg_args, int char_index, const void *word, bool word_end)

/*static PyObject *
formative_cv_ocr(PyObject *self, PyObject *args)
{
    IplImage* orig;
    IplImage* image;
    char *filedata;
    int len, w, h;
    
    PyObject* list;

    if (!PyArg_ParseTuple(args, "t#iiO", &filedata, &len, &w, &h, &list)){
        PyErr_SetString(PyExc_AttributeError, "call with (imagedata, img_len, w, h, box_list");
        return NULL;
    }
        
    CvMat* cvCreateMat( int rows, int cols, int type );

    CvMat* pic = cvCreateMatHeader(h, w, CV_8UC3);
    pic = cvInitMatHeader( pic, h, w, CV_8UC3, filedata );
    CvMat* g_pic = cvCreateMat(h,w, CV_8UC1);
    cvCvtColor(pic, g_pic, CV_RGB2GRAY);

    
    tesseract::TessBaseAPI api;
    api.Init("/usr/local/share", "eng", 0, 0, false);
    //api.SetPageSegMode(tesseract::PSM_SINGLE_WORD); // PSM_SINGLE_WORD PSM_AUTO
    //api.SetPageSegMode(tesseract::PSM_AUTO);
    
    api.SetImage( (const unsigned char*) g_pic->data.ptr,
        w,
        h,
        1, //image->depth,
        w
    );
    
    PyObject* return_list = PyList_New(PyList_Size(list));
    if (return_list == NULL){
        PyErr_SetString(PyExc_AttributeError, "I cannot parse output");
        return NULL;
    }

    
    for(int i=0; i < PyList_Size(list); i++){
    
        int x, y, w, h;
        
        PyObject* vals = PyList_GetItem(list, i);
        
        PyArg_Parse(PyList_GetItem(vals, 0), "i", &x);
        PyArg_Parse(PyList_GetItem(vals, 1), "i", &y);
        PyArg_Parse(PyList_GetItem(vals, 2), "i", &w);
        PyArg_Parse(PyList_GetItem(vals, 3), "i", &h);
    
        api.SetRectangle(
            x,y,w,h
        );
                   
        char * text = api.GetUTF8Text();
        PyObject* item = Py_BuildValue("s", text);
        PyList_SetItem(return_list, i, item);
        //delete text;
        
        //cvRectangle (
        //           g_pic,
        //            cvPoint(x,y),
        //            cvPoint(x+w,y+h),
        //            cvScalarAll(0),
        //            1, //thinkness
        //            1 // Type
        //);
        
    }
    
    //cvShowImage( "Example", g_pic );
    //cvWaitKey( 0 );
    //cvDestroyWindow("Example");
    
    cvReleaseImage(&orig);
    cvReleaseImage(&image);
    
    return return_list;
}*/


static PyObject *
formative_cv_parse(PyObject *self, PyObject *args)
{
    char *imagedata;
    int len, w, h;
    
    if (!PyArg_ParseTuple(args, "t#ii", &imagedata, &len, &w, &h)){
        PyErr_SetString(PyExc_AttributeError, "call with (imagedata, img_len, w, h");
        return NULL;
    }
    
    
    // Create new colour image from data
    Mat image = Mat( Size(w,h), CV_8UC3, imagedata);
    Mat parsedimg = image.clone(); // This image may get bastardised

    vector <retbox> * rb = parse(parsedimg);
    
    uchar* data = parsedimg.data;
    
    PyObject* return_list = PyList_New(rb->size());
    if (return_list == NULL){
        PyErr_SetString(PyExc_AttributeError, "Cannot parse output");
        return NULL;
    }


    // Create boxes
    for(int i=0; i < rb->size(); i++){
        retbox box = rb->at(i);
        PyObject* l = Py_BuildValue("[i,i,i,i,i,s]",
                box.x,box.y,box.w,box.h,box.type,box.text.c_str());
        //printf("%d %d %d %d %d\n", box.x,box.y,box.w,box.h,box.type);
        PyList_SetItem(return_list, i, l);
    }
    

    PyObject* ret = Py_BuildValue("(Os#ii)", return_list, data,
            len, parsedimg.cols, parsedimg.rows);
    
    return ret;
}


PyMethodDef methods[] = {
    //{"ocr", formative_cv_ocr, METH_VARARGS, "OCR image"},
    {"parse", formative_cv_parse, METH_VARARGS, "Parse image"},
    {NULL, NULL, 0, NULL}
};

PyMODINIT_FUNC 
initformative_cv()
{
    (void) Py_InitModule("formative_cv", methods);   
}
