#include <queue>
#include <algorithm>
#include <float.h>
#include <cvaux.h>
#include "segment.h"
#include "parse.h"


using namespace std;
using namespace cv;

// Compares features

class feature_compare{
    public:
    feature_compare(){}
    
    bool operator ()(const Feature & first, const Feature & second) const{

        Rect box1 = boundingRect(Mat(first.points));
        Rect box2 = boundingRect(Mat(second.points));

        if(box1.y+box1.height == box2.y+box2.height)
            return box1.x < box2.x;

        return box1.y+box1.height < box2.y+box2.height;
    }
};

void reduce_boxes(vector<Feature> & features){
    Feature * current = &features[0];
    bool backtracking = false;
    while(current != NULL){
        printf("%d\n", current->ftype);
        if(current->child != NULL && !backtracking){
            printf("child\n");
            current = current->child;
        }
        else if(current->next != NULL){
            printf("next\n");
            backtracking = false;
        }
        else if(current->parent != NULL){
            printf("backtrack\n");
            current = current->parent;
            backtracking = true;
        }
        else{
            break;
        }
    }
}

void parse(vector<Feature> & features){
    
    // Sort results from top left to bottom right
    reduce_boxes(features);

    sort(features.begin(), features.end(), feature_compare());
    
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
    for(vector<Feature>::iterator it = features.begin(); it != features.end(); it++){
      
        if(it->ftype == LOGO){
            it->ftype = UNCLASSIFIED;
            double area = fabs(contourArea(Mat(it->points)));
            if(l_area < area){
                logo = &*it;
                l_area = area;
            }
        }

    }

    if(l_area != 0){
        logo->ftype = LOGO;
        logo->text = "__LOGO__";
    }
    

    //HEURISTICS
    int max_y_delta = 15;
    int box_count = 0;
    int box_y = 0;
    bool reducing = false;
    // Convert boxes to rectangles
    for(vector<Feature>::iterator it = features.begin(); it != features.end(); it++){
        Feature & f = *it;

        if(f.ftype == SQUARE){
            box_count++;
            if(box_count == 1){
                box_y = f.box.height + f.box.y;
                bool reducing = true;
            }
        }

        if((reducing && ( f.ftype != SQUARE) ||
                abs(box_y - (f.box.height + f.box.y)) > max_y_delta) ){

            if(box_count > 1){
                (it-1)->box.width = (it-1)->box.x + (it-1)->box.width -
                        (it-box_count)->box.x;
                (it-1)->box.x = (it-box_count)->box.x;
                (it-1)->ftype = RECT;
                (it-1)->input_limit = box_count;
                features.erase(it-box_count, it-2);
            }
            box_count = 0;
            reducing = false;
            
        }
            
    }


    // Calculate mode for font height...
    // Should look at stdev

    float avg_text_size = 0;
    vector<int> text_height = vector<int>(200);
    for(int i = 0; i < features.size(); i++){
        if(features[i].ftype == TEXT && features[i].box.height < 200){
            text_height[features[i].box.height]++;
        }
        avg_text_size += features[i].box.height;
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

    // Bind text to box
    for(int i = 0; i < features.size(); i++){
     
        if(features[i].ftype == TEXT && approx_label_size+20 > features[i].box.height
            && approx_label_size-20 < features[i].box.height){

            int begin = i-range < 0 ? 0 : i-range;
            int end = i+range > features.size()  ? features.size() : i+range;

            double max_dist = -99999999;//DBL_MIN;
            int idx = -1;

            Point2f p = Point2f(features[i].box.x+features[i].box.width,
                features[i].box.y+features[i].box.height);

            for(int j = begin; j < end; j++){
                if(features[j].ftype == TEXT || features[j].ftype == INVALID ||
                        features[j].ftype == UNCLASSIFIED || features[j].text != "")
                    continue;
                
                
                double dist = pointPolygonTest(Mat(features[j].points), p, true);
                //printf("dist %f\n", dist);
                
                double x_dist = fabs(p.x - (features[j].box.x+features[j].box.width));
                double y_dist = fabs(p.y - (features[j].box.y+features[i].box.height));

                if (dist > 0 && (x_dist > features[j].box.width ||
                        y_dist > features[j].box.height))
                    continue;

                if(dist > max_dist){
                    max_dist = dist;
                    idx = j;
                }

            }

            if(idx != -1){
                features[idx].text = features[i].text;
                features[i].ftype = INVALID;
            }
        }
    }

    // Delete invalid elements
    vector<Feature>::iterator itc=features.begin();
    while (itc!=features.end()) {
        if(itc->ftype == INVALID || itc->ftype == UNCLASSIFIED)
            itc=features.erase(itc);
        else
            itc++;
    }
}