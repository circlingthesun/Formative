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
    printf("segment start\n");
    segment(image, features);
    printf("segment done\n");
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

        PyObject* val;
        int linked = it->label != NULL ? it->label->id : -1;

        switch(it->type){
            case TEXT:
                if(linked == -1){
                    val = Py_BuildValue(
                        "{s:s,s:i,s:i,s:i,s:i,s:s}",
                        "type", "TEXT",
                        "x", it->box.x,
                        "y", it->box.y,
                        "w", it->box.width,
                        "h", it->box.height,
                        "val", it->text.c_str()
                    );
                    break;
                }

                val = Py_BuildValue(
                    "{s:s,s:i,s:i,s:i,s:i,s:s,s:i}",
                    "type", "LABEL",
                    "x", it->box.x,
                    "y", it->box.y,
                    "w", it->box.width,
                    "h", it->box.height,
                    "val", it->text.c_str(),
                    "target", linked
                );
                break;
            case SQUARE:
                val = Py_BuildValue(
                    "{s:s,s:i,s:i,s:i,s:i,s:i}",
                    "type", "CHECKBOX",
                    "x", it->box.x,
                    "y", it->box.y,
                    "w", it->box.width,
                    "h", it->box.height,
                    "linked", linked
                );
                break;
            case RECT:
                val = Py_BuildValue(
                    "{s:s,s:i,s:i,s:i,s:i,s:s,s:i,s:i,s:i,s:i}",
                    "type", "TEXTBOX",
                    "x", it->box.x,
                    "y", it->box.y,
                    "w", it->box.width,
                    "h", it->box.height,
                    "val", it->text.c_str(),
                    "max_len", it->length,
                    "min_len", 0,
                    "not_empty", 0,
                    "linked", linked
                );
                break;
            case LINE:
                // Raise line so it becomes a box
                it->box.y -= Feature::text_mean;
                it->box.height += Feature::text_mean;
                val = Py_BuildValue(
                    "{s:s,s:i,s:i,s:i,s:i,s:s,s:i,s:i,s:i,s:i}",
                    "type", "TEXTBOX",
                    "x", it->box.x,
                    "y", it->box.y,
                    "w", it->box.width,
                    "h", it->box.height,
                    "val", it->text.c_str(),
                    "max_len", 0,
                    "min_len", 0,
                    "not_empty", 0,
                    "linked", linked
                );
                break;
            default:
                Py_DECREF(key);
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
