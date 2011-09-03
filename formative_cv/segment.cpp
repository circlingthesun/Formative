#include "segment.h"

using namespace std;
using namespace cv;

// Traverse contour tree and mark relevant boxess
bool classify(vector<vector<Point> >& contours, vector<Vec4i>& hierarchy,
        int width, int height, vector<feature> & result){

    printf("classify done\n");
    // Some heuristics
    int minimum_line_len = width/30;
    int min_box_size = pow((height+width)/120, 2);
    double horisontal_line_gradient = 0.1;
    
    // Topological info
    int parent = -1;
    FType parent_type = RECT;

    int current = 0;
    int level = 0;

    int child;
    int next;
    bool backtracking = false;

    // Traverse countours at same level
    while(current >= 0){
        //printf("Level %d\n", level);

        // New feature to be added to results
        feature element;

        // Set child & sibling & parent
        child = hierarchy[current][2];
        next = hierarchy[current][0];
        parent = hierarchy[current][3];

        // When back tracking up the tree
        if(backtracking){
            if(next > 0){
                current = next;
                backtracking = false;
                //printf("start next child\n");
            }
            else{
                current = parent;
                level--;
                //printf("start parent\n");
            }
            continue;
        }

        // Set current contour
        vector<Point> & cont = contours[current];

        // Current contour area
        double contour_area = fabs(contourArea(Mat(cont)));

        // Squares and rectangles have 4 points
        if(cont.size()==4 && contour_area > min_box_size){
            printf("BOX\n");
            // Check for square
            Point pt[4];
            for(int i=0;i<4;i++)
                pt[i] = cont[i];
            
            // Length of the 1st two lines.
            float line1 = sqrt( (float)pow((pt[0]).y-(pt[1]).y, 2) +
                    (float)pow((pt[0]).x-(pt[1]).x, 2) ); 
            float line2 = sqrt( (float)pow((pt[1]).y-(pt[2]).y, 2) +
                    (float)pow((pt[1]).x-(pt[2]).x, 2) ); 
            
            // Biggest line is line1
            if(line2>line1){
                float tmpline = line1;
                line1 = line2;
                line2 = tmpline;
            }
            
            // Ratio of the two lines
            float ratio = line1/line2;

            // Heuristic for detecting approximate square
            // Assumes paralellogram += rectangle/square
            float delta = 0.4;
            
            if((ratio - 1) < delta)
                element.ftype = SQUARE;
            else
                element.ftype = RECT;
            
            element.points = cont; // TODO: check if this works as expected

        }
        
        // Lines have two points
        else if(cont.size()==2){
            printf("LINE\n");
            Point pt[2];
            for(int i=0;i<2;i++)
                pt[i] = cont[i];
            
            // Gradient of line
            float gradient = fabs(((pt[0]).y-(pt[1]).y)/
                    (float)((pt[0]).x-(pt[1]).x));
            // Length of line
            float length = sqrt( (float)pow((pt[0]).y-(pt[1]).y, 2) + 
                    (float)pow((pt[0]).x-(pt[1]).x, 2) ); 
 
            // Look only for horisontal lines
            if(gradient < horisontal_line_gradient &&
                    length > minimum_line_len){
                element.ftype = LINE;
                element.points = cont;
            }
        }

        // Assume things that have more points are text
        // Dont add text inside text
        else if(parent_type != TEXT_BOX){
            element.ftype = TEXT_BOX;
            element.points = cont;
        }

        result.push_back(element);
         
        // All the work is done for the contour
        // Here we decide how to procede on the
        // next itteration

        // Dont recurse into text contour
        if(parent_type != TEXT_BOX){
            if(child > 0){
                current = child;
                level++;
                //printf("next child\n");
            }
            else if(next > 0){
                current = next;
                //printf("next\n");
            }
            else{
                current = parent;
                backtracking = true;
                level--;
                //printf("parent\n");
            }
        }
        else{
            current = parent;
            backtracking = true;
            printf("parent from box\n");
        }

    }    

}

vector<feature> * segment(Mat & img_rgb){

    // Create new gray scale image
    Mat image = Mat(Size(img_rgb.rows,img_rgb.cols), CV_8UC1);
    cvtColor(img_rgb,image,CV_RGB2GRAY);

    // Reference image scale, this is the size at which
    // the algorithm has been found to work
    int ref_x = 1262;
    int ref_y = 1772;
    int ref_res = ref_x*ref_y;
    
    double scale_factor =  sqrt(ref_res) /(double)sqrt(image.cols*image.rows);
    int cols = image.cols*scale_factor;
    int rows = image.rows*scale_factor;
    
    // Create new resized image
    Mat resized_img = Mat(Size(rows,cols), CV_8UC1);
    resize(image, resized_img, Size(rows,cols));

    // Calculate teh degree of smoothing required HACK!
    int avg_pix = sum(resized_img).val[0]/(double)(cols*rows);
    int kernel_size = 1;
    if(avg_pix < 190){
        kernel_size = 7;
    }
    
    // Smooth / despeckle image
    // Writeup: explain different choices
    GaussianBlur(resized_img, resized_img, Size(kernel_size, kernel_size), 0,0);

    // Clean up via addaptive threshold
    // Why  ADAPTIVE_THRESH_MEAN_C or ADAPTIVE_THRESH_GAUSSIAN_C
    // How did I get to 7, 20?
    adaptiveThreshold(resized_img, resized_img, 255, ADAPTIVE_THRESH_GAUSSIAN_C,
            THRESH_BINARY, 7, 20);
                      
    // Invert image so it represents edges?
    bitwise_not(resized_img, resized_img);
                   
    // Find contours...

    vector<vector <Point> > contours;
    vector<Vec4i> hierarchy;

    findContours(
            resized_img,
            contours,
            hierarchy,
            CV_RETR_TREE, // CV_RETR_CCOMP CV_RETR_EXTERNAL
            CV_CHAIN_APPROX_NONE
    );


    // Draw them
    for(int idx = 0; idx >= 0; idx = hierarchy[idx][0] )
    {
        Scalar color( rand()&255, rand()&255, rand()&255 );
        drawContours( img_rgb, contours, idx, color, CV_FILLED, 8, hierarchy );
    }

    // Eliminate too short or too long contours
    /*unsigned int cmin= 2; // minimum contour length
    unsigned int cmax= 100000; // maximum contour length
    vector<vector<Point> >::iterator itc=contours.begin();
    while (itc!=contours.end()) {
        if (itc->size() < cmin || itc->size() > cmax)
            itc= contours.erase(itc);
        else
            ++itc;
    }*/


    // Approximate contours
    /*itc=contours.begin();
    while (itc!=contours.end()) {
        if (itc->size() < cmin || itc->size() > cmax)
            itc= contours.erase(itc);
        else
            ++itc;
    }*/

    for( unsigned int i=0; i< contours.size(); i++ ) {
        vector<Point> & points = contours[i];


        Mat curve(points, true);
        double arc_len = arcLength(curve,true);

        vector<Point> approx;

        approxPolyDP(
            curve,
            approx,
            arc_len*0.02,// was 5. accuracy of the approximation
            true // yes it is a closed shape
        );

        if(approx.size() > 1){
            //points.clear();
            points = approx;
        }
    }


    // Classify my babies!
    vector<feature> * result = new vector<feature>();
    classify(contours, hierarchy, rows, cols, *result);


    // Scale my babies back to normal
    for( unsigned int i=0; i< contours.size(); i++ ) {
        vector<Point> & points = contours[i];

        for( unsigned  int j=0; j< points.size(); j++ ) {
            Point & p = points[j];
            p.x = p.x*(1/scale_factor);
            p.y = p.y*(1/scale_factor);
            //printf("%d, %d\n", p.x, p.y );
        }
    }

    printf("Draw done\n");

    image.release();
    resized_img.release();
    return result;
}

