#ifndef INFORM_REDUCTIONS_H
#define INFORM_REDUCTIONS_H

#include <list>
#include <cv.h>
#include "segment.h"

using namespace std;
using namespace cv;

void tree_visitor(list<Feature> & features,
        bool(*func)(Feature *, bool, list<Feature> &)){
            
    Feature * current = &features.front();
    bool backtracking = false;

        while(current != NULL){
            
            //printf("Current type %d\n", current->type);

            if (!func(current, backtracking, features))
                return;

            // Navigates tree
            //printf("type: %d, id: %i\n", current->type, current->id);
            if(current->child != NULL && !backtracking){
                //printf("child\n");
                current = current->child;
            }
            else if(current->next != NULL){
                //printf("next\n");
                backtracking = false;
                current = current->next;
            }
            else if(current->parent != NULL){
                //printf("backtrack\n");
                current = current->parent;
                backtracking = true;
            }
            else{
                break;
            }
    }
}


bool tag(Feature * current, bool backtracking, list<Feature> & features){
    if(//current->type != INVALID &&
            //current->type != UNCLASSIFIED &&
            current->type != TEXT &&
            !backtracking){
        
        // Stamp id
        char tmp[100];
        for(int x=0;x<100;x++){tmp[x]='\0';}
        sprintf ( tmp, "%d", current->id);
        current->text += string() + " id= " + tmp;

        for(int x=0;x<100;x++){tmp[x]='\0';}
        if(current->parent != NULL)
            sprintf ( tmp, "%d", current->parent->id);
        current->text += string() + ", p=" + tmp;
        
    }
    return true;
}


bool reduce_boxes(Feature * current, bool backtracking, list<Feature> & features){

    if(current->id == 641){
        printf("%d, %d, %d", current->type, current->parent, current->parent->type);
    }

    // Reduces boxes
    if(
            current->type == SQUARE &&
            current->parent != NULL &&
            current->parent->type == RECT
    ){
        int square_count = 1;
        // Check if all siblings are squares
        Feature * sibling = current->next;

        int first_size = current->box.width * current->box.height;
        
        while(sibling != NULL){
            if(sibling->type == SQUARE){
                square_count++;
                sibling = sibling->next;
            }
            else if(sibling->type == INVALID || sibling->type == UNCLASSIFIED){
                // Ignore stray elements
                // Could check size
                sibling = sibling->next;
            }
            else{
                printf("not square!! p=%d, id=%d, type=%d\n",
                        current->parent->id, sibling->id, sibling->type);
                printf("x=%d, y=%d, w=%d, h=%d\n",
                        current->box.x, current->box.y,
                        current->box.width, current->box.height);
                
                int size = sibling->box.width * sibling->box.height;

                // Check if the element is large enough
                if(true /*size < first_size/2*/){
                    square_count = -1;
                    break;
                }
                else{
                    sibling = sibling->next;
                }

                
            }
        }
        

        // Invalidate boxes and get text
        if(square_count > 1){
            string text;
            current->parent->child->type = INVALID;
            sibling = current;
            while(sibling != NULL){
                sibling->type = INVALID;
                // Probably need to use reduce function
                if(sibling->child != NULL && sibling->child->type == TEXT){
                    text += sibling->child->text; 
                }
                sibling = sibling->next;
            }
            char count[100];
            sprintf ( count, "%d", square_count);
            current->parent->text = text + " c = " + count;
            
        }

    }

    return true;
}

bool reduce_double_features(Feature * current, bool backtracking,
        list<Feature> & features){

    // Remove double feature's parent
    if(
            current->parent != NULL &&
            current->parent->type == current->type &&
            current->next == NULL
    ){
        current->parent->type = INVALID;
        if(current->parent->parent != NULL)
            current->parent->parent->child = current;
        if(current->parent->prev != NULL)
            current->prev = current->parent->prev;
        if(current->parent->next != NULL)
            current->next = current->parent->next;
        current->parent = current->parent->parent;
    }

    return true;
}



// Find position where text starts
void move_to_text_start(list<Feature> & features, list<Feature>::iterator & text_start){
    list<Feature>::iterator it;
    for(it = features.begin(); it != features.end(); it++){
        if(it->type == TEXT){
            text_start = it;
            break;
        }
    }
}


bool containment(Feature * current, bool backtracking,
        list<Feature> & features){
    // If leaf
    if(current->child == NULL){
        list<Feature>::iterator it;

        if(current->type == TEXT || current->type == INVALID ||
                current->type == UNCLASSIFIED)
                return true;

        for(move_to_text_start(features, it); it != features.end(); it++){
            
            Point2f text_mid = Point2f(it->box.x+it->box.width/2,
            it->box.y+it->box.height/2);
            double contains = pointPolygonTest(Mat(current->points), text_mid, false);
            //printf("%f\n", contains);
            //printf("Consider: %s\n", it->text.c_str());
            if(contains >= 0){
                printf("Hoorray: %s\n", it->text.c_str());
                if(current->text == "")
                    current->text = it->text;
                else
                    current->text += string("\n") + it->text;
                it = features.erase(it);
            }
        }
    }
    return true;
}




#endif // INFORM_REDUCTIONS_H