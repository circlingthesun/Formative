#ifndef INFORM_REDUCTIONS_H
#define INFORM_REDUCTIONS_H

#include <list>
#include <cv.h>
#include <limits.h>
#include "segment.h"

using namespace std;
using namespace cv;

enum Side{UP, DOWN, LEFT, RIGHT, UNDEFINED};

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


bool reduce_boxes(Feature * current, bool backtracking,
        list<Feature> & features){

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
            else if(sibling->type == INVALID ||
                    sibling->type == UNCLASSIFIED){
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
                // Canntot do coz tree traversal breaks on backtrack
                //sibling->parent = NULL;
                sibling = sibling->next;
            }
            current->parent->length=square_count;
            
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

        Feature * sibling = current->child->child;
        while(sibling != NULL){
            sibling->parent = current;
            sibling=sibling->next;
        }
        current->child->type = INVALID;
        current->child->parent = NULL;
        current->child = current->child->child;
        
        
    }

    return true;
}

bool flatten_tree(Feature * current, bool backtracking,
        list<Feature> & features){

    // If element is not a child, kill it and reparent children
    if(current->child != NULL){

        current->child->parent = NULL;

        // Link up the previous node
        if(current->prev != NULL){
            current->prev->next = current->child;
        }

        // Remove children's parent 
        Feature * child = current->child;
            while(child != NULL){
                child->parent = NULL;
                // Last child should point to next
                if(child->next == NULL){
                    child->next = current->next;
                    break;
                }
                child=child->next;
        }

        // Clean up the affairs of the parent
        // Note we set the child as the seibling so traversal continues
        current->next = current->child;
        current->child = NULL;
        current->type = INVALID;
        current->parent = NULL;

    }

    return true;
}


bool contains(Rect & outer, Rect &inner){
    if(
        outer.x < inner.x &&
        outer.y < inner.y &&
        outer.x+outer.width > inner.x+inner.width &&
        outer.y+outer.height > inner.y+inner.height
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

    if(current->type == TEXT || current->type == INVALID ||
            current->type == UNCLASSIFIED)
            return true;
        
    
    for(list<Feature>::iterator it = features.begin();
            it != features.end();it++){

        if(contains(current->box, it->box)){
            
            if(it->type==TEXT){
                if(current->text == "")
                    current->text = it->text;
                else
                    current->text += string("\n") + it->text;
                // Only erase text features
                it = features.erase(it);
            }
            // Delete what looks like a parent but isnt
            /*else if((it->type==RECT || it->type==SQUARE) &&
                    it->parent == NULL){
                current->type = INVALID;
            }*/
            

        }
    }

    return true;
}

// HEURISTIC
int MAX_DIST = 100;

// Return negative if not on left
/*int dist(const Feature & text, const Feature & f){
    const int text_height = text.box.height;
    int y_start_box, y_end_box;
    int x_start_box, x_end_box;

    int y_start_text = text.box.y, y_end_text = text.box.y + text.box.height;
    int x_start_text = text.box.x, x_end_text = text.box.x + text.box.width;


    if(f.type==LINE){
        y_start_box = f.box.y - text_height*1.5;
        y_end_box = f.box.y + text_height*0.5;

    }
    else if(f.type==RECT || f.type==SQUARE){
        y_start_box = f.box.y - text_height*0.8;
        y_end_box = f.box.y + f.box.height + text_height*0.8;
    }
    else
        return MAX_DIST;

    x_start_box = f.box.x - 10;
    x_end_box = f.box.x + f.box.width + 10;

    int dist = MAX_DIST;
    int tmp_dist = MAX_DIST;

    //First check horisontal
    if(
        // Check Y bounds
        y_end_text <= y_end_box &&
        y_start_text >= y_start_box
    ){
        
        // Left
        if(x_start_text <= x_end_box){
            dist = x_end_text  - x_start_box;
        }

        // Right
        if(x_start_box <= x_start_text){
            tmp_dist = x_start_text - x_end_box;
            if(tmp_dist < dist)
                dist = tmp_dist;
        }
        
    }
    // If no match then vertitical
    if(dist >= MAX_DIST &&
        // Check X bounds
        x_end_text <= x_end_box &&
        x_start_text >= x_start_box
    ){
      
        // Top
        if(y_start_text <= y_end_box){
            dist = y_end_text  - y_start_box;
        }

        // Bottom
        if(y_start_box >= y_start_text){
            tmp_dist = y_start_text - y_end_box;
            if(tmp_dist < dist)
                dist = tmp_dist;
        }

        
    }

    return dist;
}*/


// Return negative if not on left
int calc_dist(const Feature & text, const Feature & f){
    const int text_height = text.box.height;
    int y_start, y_end;
    int x_start, x_end;

    if(f.type==LINE){
        y_start = f.box.y - text_height*1.5;
        y_end = f.box.y + text_height*0.5;

    }
    else if(f.type==RECT || f.type==SQUARE){
        y_start = f.box.y - text_height*0.8;
        y_end = f.box.y + f.box.height + text_height*0.8;
    }
    else
        return INT_MAX;

    x_start = f.box.x - 10;
    x_end = f.box.x + 10;

    int dist = INT_MAX;
    int tmp_dist = INT_MAX;

    //First check horisontal
    if(
        // Check Y bounds
        y_start <= text.box.y + text.box.height &&
        y_end >= text.box.y+text.box.height
    ){
        
        // Left preferential
        if(text.box.x <= f.box.x){
            dist = f.box.x - (text.box.x + text.box.width);
        }

        // Right
        if(text.box.x >= f.box.x+f.box.width){
            tmp_dist = text.box.x - (f.box.x+f.box.width);
            if(tmp_dist < dist)
                dist = tmp_dist;
        }
        
    }
    // If no match then vertitical
    if(dist == INT_MAX &&
        // Check X bounds
        x_start <= text.box.x &&
        x_end >= text.box.x+text.box.width
    ){
      
        // Top preferential
        if(text.box.y <= f.box.y){
            dist = f.box.y - (text.box.y + text.box.height);
        }

        // Bottom
        if(text.box.y >= f.box.y+f.box.height){
            tmp_dist = text.box.y - (f.box.y+f.box.height);
            if(tmp_dist < dist)
                dist = tmp_dist;
        }

        
    }

    return dist;
}



bool bindtext_hor(Feature * current, bool backtracking,
        list<Feature> & features){
    
    // If the visitor is backtracking, if it already has a
    // label or if the box is not a leaf
    if(backtracking || current->label != NULL ||
            current->child != NULL)
        return true;

    if(current->type == TEXT || current->type == INVALID ||
            current->type == UNCLASSIFIED)
            return true;
    // HEURISTIC
    int min_dist = MAX_DIST;
    Side min_side = UNDEFINED;
    Feature * match = NULL;

    // Find a match
    for(list<Feature>::iterator it = features.begin();
            it != features.end(); it++){
        if(it->label != NULL || it->box.height > Feature::text_mean ||
                it->type!=TEXT)
            continue;

        int dist = calc_dist(*it, *current);
        if(dist<min_dist){
            min_dist = dist;
            match = &*it;
        }
    }

    if(match != NULL && min_dist < MAX_DIST){
            current->label = match;
            match->label = current;
            current->text += string() + match->text;      
    }


    return true;
}




#endif // INFORM_REDUCTIONS_H