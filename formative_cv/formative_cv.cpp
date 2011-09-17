#include <stdio.h>
#include <math.h>
#include <vector>
#include <list>
#include <iostream>
#include <cv.h>
#include <Python.h>
#include "parse.h"
#include "segment.h"

using namespace std;
using namespace cv;


static PyObject *
formative_cv_process(PyObject *self, PyObject *args)
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
    list<Feature> features;
    segment(image, features);
    parse(features);
    
    printf("parse done\n");
    // Marshall and return features...

    PyObject* return_dict = PyDict_New();

    if (return_dict == NULL){
        PyErr_SetString(PyExc_AttributeError, "Cannot create a new dict");
        return NULL;
    }


    // Build dict with return objects
    list<Feature>::iterator it;
    for(it = features.begin(); it != features.end(); it++){
        PyObject* key = Py_BuildValue("i", it->id);

        PyObject* bounding_box = Py_BuildValue(
                "[i,i,i,i]",
                it->box.x,it->box.y,it->box.width, it->box.height
        );

        PyObject* val;

        switch(it->type){
            case TEXT:
                if(it->label == NULL){
                    val = Py_BuildValue(
                        "{s:s,s:O,s:s}",
                        "type", "TEXT",
                        "bounding_box", bounding_box,
                        "val", it->text.c_str()
                    );
                    break;
                }

                val = Py_BuildValue(
                    "{s:s,s:O,s:s,s:i}",
                    "type", "LABEL",
                    "bounding_box", bounding_box,
                    "val", it->text.c_str(),
                    "target", it->label->id
                );
                break;
            case SQUARE:
                val = Py_BuildValue(
                    "{s:s,s:O}",
                    "type", "CHECKBOX",
                    "bounding_box", bounding_box
                );
                break;
            case RECT:
                val = Py_BuildValue(
                    "{s:s,s:O,s:s,s:i}",
                    "type", "TEXTBOX",
                    "bounding_box", bounding_box,
                    "val", it->text.c_str(),
                    "len", it->length
                );
                break;
            case LINE:
                val = Py_BuildValue(
                    "{s:s,s:O,s:s}",
                    "type", "TEXTBOX",
                    "bounding_box", bounding_box,
                    "val", it->text.c_str()
                );
                break;
            default:
                Py_DECREF(key);
                Py_DECREF(bounding_box);
                continue;
        }


        PyDict_SetItem(return_dict, key, val);
        
    }
    

    printf("marshalling done\n");
    return return_dict;
}

static PyObject *
formative_cv_process2(PyObject *self, PyObject *args)
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
    list<Feature> features;
    
    segment(image, features);
    parse(features);
    
    PyObject* return_list = PyList_New(features.size());
    if (return_list == NULL){
        PyErr_SetString(PyExc_AttributeError, "Cannot create a new dict");
        return NULL;
    }


    // Create boxes
    int i = 0;
    list<Feature>::iterator it;
    for(it = features.begin(); it != features.end(); it++){
        Feature & f = *it;
        PyObject* l = Py_BuildValue("[i,i,i,i,i,s]",
                f.box.x,f.box.y,f.box.width,f.box.height,f.type,f.text.c_str());
        PyList_SetItem(return_list, i++, l);
    }
    

    PyObject* ret = Py_BuildValue("(Os#ii)", return_list, imagedata,
            len, image.cols, image.rows);
    
    return ret;
}


PyMethodDef methods[] = {
    {"process", formative_cv_process, METH_VARARGS,
            "Processes image and returns it with results"},
    {"process2", formative_cv_process2, METH_VARARGS,
            "Processes image and returns it with results"},
    {NULL, NULL, 0, NULL}
};

PyMODINIT_FUNC 
initformative_cv()
{
    (void) Py_InitModule("formative_cv", methods);   
}
