#include <stdio.h>
#include <math.h>
#include <vector>
#include <iostream>
#include <cv.h>
#include <Python.h>
#include "parse.h"
#include "segment.h"

using namespace std;
using namespace cv;


static PyObject *
formative_cv_parse(PyObject *self, PyObject *args)
{
    char *imagedata;
    int len, w, h;
    
    if (!PyArg_ParseTuple(args, "t#ii", &imagedata, &len, &w, &h)){
        PyErr_SetString(PyExc_AttributeError, "call with (imagedata, img_len,\
            w, h");
        return NULL;
    }
    
    
    // Create new colour image from data
    Mat image = Mat( Size(w,h), CV_8UC3, imagedata);

    // Magic happens here
    vector<Feature> features;
    segment(image, features);
    parse(features);
    
    PyObject* return_list = PyList_New(features.size());
    if (return_list == NULL){
        PyErr_SetString(PyExc_AttributeError, "Cannot create a new list");
        return NULL;
    }


    // Create boxes
    for(unsigned int i=0; i < features.size(); i++){
        Feature f = features[i];
        PyObject* l = Py_BuildValue("[i,i,i,i,i,s]",
                f.box.x,f.box.y,f.box.width,f.box.height,f.ftype,f.text.c_str());
        //printf("%d %d %d %d %d\n", box.x,box.y,box.w,box.h,box.type);
        PyList_SetItem(return_list, i, l);
    }
    

    PyObject* ret = Py_BuildValue("(Os#ii)", return_list, imagedata,
            len, image.cols, image.rows);
    
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
