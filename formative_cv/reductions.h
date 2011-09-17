#ifndef INFORM_REDUCTIONS_H
#define INFORM_REDUCTIONS_H

#include <list>
#include <cv.h>
#include <limits.h>
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
    if(current->type != INVALID &&
            current->type != UNCLASSIFIED &&
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
            current->parent->child = NULL;
            sibling = current;
            while(sibling != NULL){
                sibling->type = INVALID;
                // Probably need to use reduce function
                if(sibling->child != NULL && sibling->child->type == TEXT){
                    text += sibling->child->text; 
                }
                sibling = sibling->next;
            }

            current->parent->length=square_count;
            /*char count[100];
            sprintf ( count, "%d", square_count);
            current->parent->text = text + " c = " + count;*/
            
        }

    }

    return true;
}

bool reduce_double_features(Feature * current, bool backtracking,
        list<Feature> & features){

    // Remove double feature's parent
    if(
            current->child != NULL &&
            current->child->type == current->type &&
            current->child->next == NULL &&
            current->child->prev == NULL
    ){
        current->child->type = INVALID;
        
        Feature * sibling = current->child->child;
        while(sibling != NULL){
            sibling->parent = current;
            sibling=sibling->next;
        }
        current->child = current->child->child;
        
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

bool contains(Rect & outer, Rect &inner){
    if(
        outer.x <= inner.x &&
        outer.y <= inner.y &&
        outer.x+outer.width >= inner.x+inner.width &&
        outer.y+outer.height >= inner.y+inner.height
    )
        return true;
    
    return false;
}

bool containment(Feature * current, bool backtracking,
        list<Feature> & features){

    if(backtracking)
        return true;
    // If leaf
    if(current->child != NULL)
        return true;

    list<Feature>::iterator it;

    if(current->type == TEXT || current->type == INVALID ||
            current->type == UNCLASSIFIED)
            return true;

    for(move_to_text_start(features, it); it != features.end(); it++){
        
        //printf("%f\n", contains);
        //printf("Consider: %s\n", it->text.c_str());
        if(contains(current->box, it->box)){
            printf("Hoorray: %s\n", it->text.c_str());
            if(current->text == "")
                current->text = it->text;
            else
                current->text += string("\n") + it->text;
            it = features.erase(it);
        }
    }

    return true;
}

// Return negative if not on left
int left_dist(const Feature & text, const Feature & f){
    const int text_height = text.box.height;
    int y_start, y_end;

    if(f.type==LINE){
        y_start = f.box.y - text_height*1.5;
        y_end = f.box.y + text_height*0.5;
    }
    else if(f.type==RECT || f.type==SQUARE){
        y_start = f.box.y - text_height/2;
        y_end = f.box.y + f.box.height + text_height/2;
    }
    else
        return INT_MAX;

    if(
        // Check Y bounds
        y_start <= text.box.y &&
        y_end >= text.box.y+text.box.height &&
        // Check if input is left of text
        f.box.x >= text.box.x// + text.box.width
    ){
        printf("type %d, dist %d\n", f.type, text.box.x - f.box.x);
        return f.box.x - (text.box.x + text.box.width);
    }
    return INT_MAX;
}

bool bound_left(Feature * current, bool backtracking,
        list<Feature> & features){
    
    if(backtracking || current->label != NULL)
        return true;

    // If leaf
    if(current->child != NULL)
        return true;

    list<Feature>::iterator it;

    if(current->type == TEXT || current->type == INVALID ||
            current->type == UNCLASSIFIED)
            return true;
    
    int min_dist = INT_MAX;
    Feature * match = NULL;

    for(move_to_text_start(features, it); it != features.end(); it++){
        if(it->label != NULL)
            continue;
        int dist = left_dist(*it, *current);
        if(dist<min_dist){
            min_dist = dist;
            match = &*it;
        }
    }

    if(match != NULL){
            current->label = match;
            match->label = current;
            current->text += string() + match->text;      
    }


    return true;
}




#endif // INFORM_REDUCTIONS_H