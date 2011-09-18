#include <queue>
#include <algorithm>
#include <stdio.h>
#include <float.h>
#include <list>
#include <cvaux.h>
#include "segment.h"
#include "parse.h"
#include "reductions.h"



using namespace std;
using namespace cv;

void parse(list<Feature> & features){
    
    // Sort results from top left to bottom right
    
    tree_visitor(features, reduce_double_features);
    tree_visitor(features, reduce_boxes);
    //tree_visitor(features, tag);
    tree_visitor(features, containment);
    tree_visitor(features, bound_left);
    
    /*for(list<Feature>::iterator it = features.begin(); it != features.end(); it++){
      
        // Stamp id
        char tmp[100];
        for(int x=0;x<100;x++){tmp[x]='\0';}

        sprintf ( tmp, "%d", it->id);
        it->text += string() + " id= " + tmp;

        for(int x=0;x<100;x++){tmp[x]='\0';}
        if(it->parent != NULL)
            sprintf ( tmp, "%d", it->parent->id);
        it->text += string() + ", p=" + tmp;

        for(int x=0;x<100;x++){tmp[x]='\0';}
        if(it->child != NULL)
            sprintf ( tmp, "%d", it->child->id);
        it->text += string() + ", c=" + tmp;

        for(int x=0;x<100;x++){tmp[x]='\0';}
        if(it->next != NULL)
            sprintf ( tmp, "%d", it->next->id);
        it->text += string() + ", n=" + tmp;

    }*/


    // Set up heuristic variables
    /*double dist_weight = 0.2;
    double logo_rank = 0;
    CvRect logo_box;
    int m_y = img_rgb.rows/2;
    int m_x = img_rgb.cols/2;
    double max_dist = edist(m_x, m_y);*/

    vector <retbox> * ret = new vector<retbox>();

    Feature * logo;
    double l_area = 0;

    // Find logo
    for(list<Feature>::iterator it = features.begin(); it != features.end(); it++){
      
        if(it->type == LOGO){
            it->type = UNCLASSIFIED;
            double area = fabs(contourArea(Mat(it->points)));
            if(l_area < area){
                logo = &*it;
                l_area = area;
            }
        }

    }

    if(l_area != 0){
        logo->type = LOGO;
        logo->text = "__LOGO__";
    }
   

    //HEURISTICS
    int max_y_delta = 15;
    int box_count = 0;
    int box_y = 0;
    bool reducing = false;

    // Convert boxes to rectangles
    /*for(list<Feature>::iterator it = features.begin(); it != features.end(); it++){
        Feature & f = *it;

        if(f.type == SQUARE){
            box_count++;
            if(box_count == 1){
                box_y = f.box.height + f.box.y;
                bool reducing = true;
            }
        }

        if((reducing && ( f.type != SQUARE) ||
                abs(box_y - (f.box.height + f.box.y)) > max_y_delta) ){

            if(box_count > 1){
                (it-1)->box.width = (it-1)->box.x + (it-1)->box.width -
                        (it-box_count)->box.x;
                (it-1)->box.x = (it-box_count)->box.x;
                (it-1)->type = RECT;
                (it-1)->input_limit = box_count;
                features.erase(it-box_count, it-2);
            }
            box_count = 0;
            reducing = false;
            
        }
            
    }*/


    // Calculate mode for font height...
    // Should look at stdev

    /*float avg_text_size = 0;
    vector<int> text_height = vector<int>(200);
    list<Feature>::iterator it;
    for(it = features.begin(); it != features.end(); it++){
        if(it->type == TEXT && it->box.height < 200){
            text_height[it->box.height]++;
        }
        avg_text_size += it->box.height;
    }

    avg_text_size/=features.size();

    int max = -1;
    int max_idx = -1;
    for(int i = 0; i < text_height.size(); i++){
        if(text_height[i] > max){
            max_idx=i;
        }
    }

    int approx_label_size = text_height[max_idx];


    // HEURISTIC
    // Neighbourhood that needs to be searched for text
    
    int range = 20;
*/
    // Bind text to box
    /*for(it = features.begin(); it != features.end(); it++){
     
        if(it->type == TEXT && approx_label_size+20 > it->box.height
            && approx_label_size-20 < it->box.height){

            int begin = i-range < 0 ? 0 : i-range;
            int end = i+range > features.size()  ? features.size() : i+range;

            double max_dist = -99999999;//DBL_MIN;
            
            list<Feature>::iterator best_match;

            Point2f p = Point2f(it->box.x+it->box.width,
                it->box.y+it->box.height);

            list<Feature>::iterator it2;
            for(it2 = features.begin(); it2 != features.end(); it2++){
                if(it2->type == TEXT || it2->type == INVALID ||
                        it2->type == UNCLASSIFIED || it2->text != "")
                    continue;
                
                
                double dist = pointPolygonTest(Mat(it2->points), p, true);
                //printf("dist %f\n", dist);
                
                double x_dist = fabs(p.x - (it2->box.x+it2->box.width));
                double y_dist = fabs(p.y - (it2->box.y+it->box.height));

                if (dist > 0 && (x_dist > it2->box.width ||
                        y_dist > it2->box.height))
                    continue;

                if(dist > max_dist){
                    max_dist = dist;
                    best_match = it2;
                }

            }

            if(idx != -1){
                best_match->text = it->text;
                it->type = INVALID;
            }
        }
    }*/

    // Delete invalid elements
    list<Feature>::iterator itc=features.begin();
    while (itc!=features.end()) {
        if(itc->type == INVALID || itc->type == UNCLASSIFIED)
            itc=features.erase(itc);
        else
            itc++;
    }
}