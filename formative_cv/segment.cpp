#include <list>
#include <boost/algorithm/string.hpp>
#include <tesseract/baseapi.h>
#include <tesseract/tesseractmain.h>
#include "segment.h"
#include "unskew.h"
#include "highgui.h"


using namespace boost;
using namespace std;
using namespace cv;
using namespace tesseract;

// Static init
int Feature::next_id = 0;
float Feature::text_mean = 0.0f;
float Feature::text_std_dev = 0.0f;

void make_structuring_el(int size, vector<Mat> & structs){
    // Structuring elements...
    for(int i = 0; i < 11; i++){
        structs[i] =
            getStructuringElement(MORPH_CROSS, Size(size,size));
    }

    int mid = size/2;

    // Whipe out correct areas
    for(int y = 0; y < size; y++){
        for(int x = 0; x < size; x++){
            // Vertical line
            if(x != mid)
                structs[0].at<uchar>(x,y)=0;
            // Horisontal line
            if(y != mid)
                structs[1].at<uchar>(x,y)=0;
            // Top t
            if(y > mid)
                structs[2].at<uchar>(x,y)=0;
            // Bottom t
            if(y < mid)
                structs[3].at<uchar>(x,y)=0;
            // Left t
            if(x < mid)
                structs[4].at<uchar>(x,y)=0;
            // Right t
            if(x > mid)
                structs[5].at<uchar>(x,y)=0;
            // Top left
            if(x <= mid && y <= mid && (x != y))
                structs[6].at<uchar>(x,y)=0;
            // Top right
            if(x >= mid && y <= mid && (x != y))
                structs[7].at<uchar>(x,y)=0;
            // Bottom left
            if(x <= mid && y >= mid && (x != y))
                structs[8].at<uchar>(x,y)=0;
            // Bottom right
            if(x >= mid && y >= mid && (x != y))
                structs[9].at<uchar>(x,y)=0;      
        }
    }
}

void ocr_text(Mat & image, Mat & original, list<Feature> & results){
    // smear the text with an elipse

    // Scale for ocr
    // 2480 X 3508 = 300 dpi
    int ref_x = 2480*1.5;
    int ref_y = 3508*1.5;
    double x_ra = (double)image.rows/ref_x;
    double y_ra = (double)image.cols/ref_y;
    double scale_factor = y_ra;
    if(x_ra > y_ra)
        scale_factor = x_ra;
    int cols = image.cols/scale_factor+0.5;
    int rows = image.rows/scale_factor+0.5;
    Mat ocr_img = Mat(Size(cols,rows), CV_8UC1);
    resize(original, ocr_img, Size(cols,rows));

    // Note should perhaps only scale cut out bits of image
    // Need to set accuracy threshold
    Mat smear = Mat(Size(cols,rows), CV_8UC1);
    resize(image, smear, Size(cols,rows));

    // Should set to space between lines
    int smear_x = 40;
    Mat elipse = getStructuringElement(MORPH_RECT, Size(smear_x,1));
    erode(smear, smear, elipse, Point(-1, -1), 1);

    elipse = getStructuringElement(MORPH_ELLIPSE, Size(3,3));
    threshold(smear, smear, 50, 255, THRESH_BINARY);

    // See smearing
    //resize(smear, original, Size(original.cols,original.rows));


    vector<vector <Point> > contours;
    findContours(
        smear,
        contours,
        CV_RETR_TREE, // CV_RETR_CCOMP CV_RETR_EXTERNAL
        CV_CHAIN_APPROX_NONE
    );    

    smear.release();

    // OCR
    TessBaseAPI api;
    api.Init("/usr/local/share", "eng", 0, 0, false);
    api.SetPageSegMode(PSM_SINGLE_LINE);
    api.SetAccuracyVSpeed(AVS_MOST_ACCURATE);

    api.SetVariable("tessedit_char_whitelist",
            "abcdefghijklmnopqrstuvwxyz\
            ABCDEFGHIJKLMNOPQRSTUVWXYZ\
            0123456789()\
            .:\"/?!&*+-=$#@");
    
    api.SetImage( (const unsigned char*) ocr_img.data,
        ocr_img.cols,
        ocr_img.rows,
        1, //image->depth,
        ocr_img.step1()
    );

    /*int min_area = (ocr_img.rows*ocr_img.cols)/pow(140, 2);
    int max_area = (ocr_img.rows*ocr_img.cols)/2;*/

    int max_height = 200;

    int sum_x = 0;
    int sum_x_2 = 0;
    int n = 0; 

    for(int i = 0; i < contours.size(); i++){

        /*double contour_area = fabs(contourArea(Mat(contours[i])));
        if(contour_area < min_area ||contour_area > max_area)
            continue;*/
        

        Rect box = boundingRect(Mat(contours[i]));
        if(box.height < 20 || box.width < 20 || box.height > max_height)
            continue;

        box.x += smear_x/2;
        box.width -= smear_x/2;
        box.y -= 2;
        box.height +=2;

        api.SetRectangle(
            box.x-2,
            box.y-2,
            box.width+2,
            box.height+2
        );
                 
        char * output = api.GetUTF8Text();
        string text = output;
        delete [] output;
        trim(text);        

        // Scale back to normal
        vector<Point> & points = contours[i];

        for( unsigned  int j=0; j< points.size(); j++ ) {
            Point & p = points[j];
            p.x = p.x*scale_factor+0.5;
            p.y = p.y*scale_factor+0.5;
        }
        
        box = boundingRect(Mat(contours[i]));
        box.x += smear_x/2*scale_factor;
        box.width -= smear_x/2*scale_factor;

        FType t = TEXT;
        if(text.size() == 0)        
            t  = LOGO;
        
        if(api.MeanTextConf() > 20){
            results.push_back(Feature(t,box,contours[i],text));
            // Stats
            n++;
            sum_x += box.height;
            sum_x_2 += box.height*box.height;
        }
        Feature::text_mean = sum_x/(float)n;
        Feature::text_std_dev = (sum_x_2 - sum_x*sum_x/(float)n)/(n-1);
    }

    ocr_img.release();
}


void classify_contour(Feature & element,
        int width, int height){

    vector<Point> & cont = element.points;

    // HEURISTICS
    // Determines the smallest and biggest elements accepted
    // Function of the document size


    int min_line_len = 100;
    int min_box_width = 20;
    int min_box_height = 20;
    double horisontal_line_gradient = 0.1;

    // Determines how much sides of a "Square" may differ
    // Ratio - 1 = delta
    // Assumes paralellogram += rectangle/square
    float delta = 0.5;

    element.box = boundingRect(Mat(cont));

    // Squares and rectangles have 4 points
    if(cont.size()==4 && element.box.width > min_box_width &&
            element.box.height > min_box_height){

        // Check for square
        Point pt[4];
        for(int i=0;i<4;i++)
            pt[i] = cont[i];
        
        // Length of the 1st two lines.
        float line1 = sqrt( (float)pow((pt[0]).y-(pt[1]).y, 2) +
                (float)pow((pt[0]).x-(pt[1]).x, 2) ); 
        float line2 = sqrt( (float)pow((pt[1]).y-(pt[2]).y, 2) +
                (float)pow((pt[1]).x-(pt[2]).x, 2) ); 
        
        // Set longest line as line1
        if(line2>line1){
            float tmpline = line1;
            line1 = line2;
            line2 = tmpline;
        }
        
        // Ratio of the two lines
        float ratio = line1/line2;

        if((ratio - 1) < delta)
            element.type = SQUARE;
        // Assume line 1 is horisontal
        else if(line1 > min_box_width)
            element.type = RECT;
    }
    
    // Lines have two points and are horisontal
    else if(cont.size()==2){
        //printf("LINE\n");
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
                length > min_line_len){
            element.type = LINE;
        }
    }
    else if(cont.size()==0){
        element.type = INVALID;
    }
    // Assume things that have more or less points are probably text
    else{
        element.type = UNCLASSIFIED;
    }
}

// Depth first traverse of contour tree
// Classify contours
void build_feature_tree(vector<vector<Point> >& contours, vector<Vec4i>& hierarchy,
        int width, int height, list<Feature> & result){
    printf("11111\n");
    // Topological info
    int parent = -1;
    int child = -1;
    int next = -1;
    int current = 0;
    int level = 0;

    // Topological info in terms of features
    Feature * fparent = NULL;
    Feature * fprev = NULL;

    Feature * last_push = NULL;

    bool backtracking = false;

    int random_id = 33;
    int count = 0;
    // Traverse countours at same level
    while(current >= 0){

        if(backtracking){
            //printf("<-----------BACKTRACKING\n");
            current = parent;
            level--;

            if(fparent != NULL){
                fprev = fparent;
                fparent = fparent->parent;
            }
            

        }
        // Update child, sibling & parent
        child = hierarchy[current][2];
        next = hierarchy[current][0];
        parent = hierarchy[current][3];
        // Safety
        /*if(level < 0){
            printf("Safety!\n");
            return;
        }*/

        if(backtracking){
            // Try to move forward or backtrack again
            if(next > 0 && next < contours.size()){
                current = next;
                // Update child, sibling
                child = hierarchy[current][2];
                next = hierarchy[current][0];
                backtracking = false;
            }
            else{
                continue; // Backtrack some more
            }
        }

        // New Feature to be added to results
        Feature element;
        element.prev = fprev;
        element.parent = fparent;
        element.points = contours[current];

        //printf("-----------NEXT ITTERATION---------\n");
        //if(fparent != NULL)
        //    printf("parent = %d\n", fparent->id);
        //else
        //    printf("parent = NULL\n");
        //if(fprev != NULL)   
        //    printf("prev   = %d\n", fprev->id);
        //else
        //    printf("prev   = NULL\n");

        // Classify the contour
        classify_contour(element, width, height);
        // Dont traverse into invalid elements?
        int size = element.box.width*element.box.height;

        last_push = &result.back();
        result.push_back(element);


        // Set variables in feature tree
        // If child was just pushed
        if(fprev == NULL){
            if(fparent != NULL){
                fparent->child = &result.back();
                //printf("retropectively set child of %d to %d\n",
                //    fparent->id, result.back().id);
            }
            fprev = &result.back();
            
        }
        // If sibling was just pushed
        else if(fprev != NULL){
            fprev->next = &result.back();
            //printf("retropectively set next of %d to %d\n",
            //        fprev->id, result.back().id);
        }


        // All the work is done for the contour
        // Here we decide how to procede on the
        // next itteration

        // Set variables for next itteration
        //printf("Next itteration set----\n");

        if(child > 0){
            //printf("Next itteration CHILD\n");
            current = child;
            fparent = &result.back();
            fprev = NULL;
            level++;
            //printf("Parent id = %d\n", result.back().id); 
        }
        else if(next > 0){
            //printf("Next itteration NEXT\n");
            current = next;
            fprev = &result.back();
            //printf("Prev id = %d\n", result.back().id);
        }
        else{
            backtracking = true;
        }

        /*if(last_push == NULL)
            continue;
        printf("####################\n"); 
        printf("PUSHED: %d\n", last_push->id);
        printf("####################\n"); 
        if(last_push->parent != NULL)
            printf("parent = %d\n", last_push->parent->id);
        else
            printf("parent = NULL\n");
        if(last_push->child != NULL)   
            printf("child  = %d\n", last_push->child->id);
        else
            printf("child   = NULL\n");
        if(last_push->next != NULL)
            printf("next = %d\n", last_push->next->id);
        else
            printf("next = NULL\n");
        if(last_push->prev != NULL)
            printf("prev   = %d\n", last_push->prev->id);
        else
            printf("prev   = NULL\n");
        printf("####################\n");
*/

    }

}

void segment(Mat & img_rgb, list<Feature> & features){
    //unskew(img_rgb);
    // Create new gray scale image

    Mat image = Mat(Size(img_rgb.cols, img_rgb.rows), CV_8UC1);
    cvtColor(img_rgb,image,CV_RGB2GRAY);

    ////////////////// DONE IN BROWSER /////////
    // Reference image scale, this is the size at which
    // the algorithm has been found to work
    /*int ref_x = 1262;
    int ref_y = 1772;
    
    // Scale up/down to reference scale size
    double scale_factor;

    double x_ra = (double)image.rows/ref_x;
    double y_ra = (double)image.cols/ref_y;

    if(x_ra > y_ra)
        scale_factor = x_ra;
    else
        scale_factor = y_ra;

    int cols = image.cols/scale_factor+0.5;
    int rows = image.rows/scale_factor+0.5;
    
    // Create new resized image
    Mat image = Mat(Size(cols,rows), CV_8UC1);
    resize(image, image, Size(cols,rows));
    */
    /////////////////////////////////////////////////

    // Calculate the degree of smoothing required HACK!
    
    int kernel_size = 3;
    /*int avg_pix = sum(image).val[0]/(double)(cols*rows);
    if(avg_pix < 190){
        kernel_size = 7;
    }*/
    
    // Smooth / despeckle image
    // Writeup: explain different choices
    // Guasian loses to much detail
    GaussianBlur(image, image, Size(kernel_size, kernel_size), 0,0);

    //medianBlur(image, image,, 3);

    // Clean up via addaptive threshold
    // Why  ADAPTIVE_THRESH_MEAN_C or ADAPTIVE_THRESH_GAUSSIAN_C
    // How did I get to 7, 20?
    adaptiveThreshold(image, image, 255, ADAPTIVE_THRESH_MEAN_C,
            THRESH_BINARY, 7, 10);


    // Invert image so white represents an edge
    bitwise_not(image, image);

    // So lets connect the lines
    // Assumption that the image has been deskewed
    
    //dilate(image, image, cross_struct_el)

    // HEURISTICS
    int depth = 1;
    int size = 21; // was 21

    // Structuring elements...
    vector<Mat> structs(11);
    make_structuring_el(size, structs);
    int mid = size/2;

    // temp image used for all morph operations
    Mat temp_img = Mat(Size(image.cols,image.rows), CV_8UC1);
    Mat morph_img = Mat(Size(image.cols,image.rows), CV_8UC1, Scalar(0));

    // Find horisontal and vertical
    for(int i = 0; i < 2; i++){
        morphologyEx(image, temp_img, MORPH_OPEN,
            structs[i], Point(-1, -1), depth);
        bitwise_or(temp_img, morph_img, morph_img);
    }

    morph_img;
    morph_img.copyTo(temp_img);

    // Dillate with cross so we get better connections
    // DOES NOT WORK SINCE BORDERING NOISE GETS CONNECTED
    // INSTEAD TRY ALL CORNER TYPES??
    Mat cross_struct_el = getStructuringElement(MORPH_CROSS, Size(3,3));
    dilate(morph_img, morph_img, cross_struct_el, Point(-1, -1), 1);

    // Create new horisontal structuring element & dillate
    // This takes care of dotted lines
    // TODO need better approach
    
    //Mat hor_line_st2(Size(1,3), CV_8U, Scalar(1));
    //dilate(image, image, structs[1], Point(-1, -1), 1);
    //morphologyEx(image, image, MORPH_OPEN,
    //        hor_line_st2, Point(-1, -1), 1);
     

    // Find contours
    // BEWARE EDGE DETECTS IMAGE
    vector<vector <Point> > contours;
    vector<Vec4i> hierarchy;
    findContours(
        temp_img,
        contours,
        hierarchy,
        CV_RETR_TREE, // CV_RETR_CCOMP CV_RETR_EXTERNAL
        CV_CHAIN_APPROX_NONE
    );


    float approx_accuracy=0.015; // was 0.2

    // Approximate contours
    vector<vector<Point> >::iterator itc=contours.begin();
    while (itc!=contours.end()) {

        Mat poly(*itc, true);
        double arc_len = arcLength(poly,true);
        double accuracy = arc_len*approx_accuracy;

        vector<Point> approx;

        approxPolyDP(
            poly,
            approx,
            accuracy,// was 5. accuracy of the approximation
            true // yes it is a closed shape
        );

        if(approx.size() > 1){
            *itc = approx;
            ++itc;
        }
        else if(itc->size() < 1){
            // Eliminate short contours
            printf("Discarded size = %d\n", itc->size());
            itc->clear();
        }
    }


    // Scale my babies back to normal
    /*for( unsigned int i=0; i< contours.size(); i++ ) {
        vector<Point> & points = contours[i];

        for( unsigned  int j=0; j< points.size(); j++ ) {
            Point & p = points[j];
            p.x = p.x*scale_factor+0.5;
            p.y = p.y*scale_factor+0.5;
        }
    }*/

    
    //////////// DRAWING CODE BRINGS UP WINDOW /////////////
    /*Mat tmp(Size(image.cols, image.rows), CV_8UC3, Scalar(255,255,255));
    for(int idx = 0; idx >= 0; idx = hierarchy[idx][0] ){
        Scalar color( rand()&255, rand()&255, rand()&255 );
        drawContours( tmp, contours, idx, color, CV_FILLED, 8, hierarchy );
    }
    namedWindow("LemmeSee",1);
    imshow("LemmeSee", tmp);
    waitKey(0);*/
    /////////////////////////////////////////////////////////



    // Classify features and build tree
    // bad alloc here
    build_feature_tree(contours, hierarchy, image.cols, image.rows, features);


    // Flood fill out noise && text
    for(list<Feature>::iterator it = features.begin(); it != features.end(); it++){
        if(it->type == UNCLASSIFIED ){
            Point p = it->points[0];
            // Move the edge point onto the line
            // Assume at least 2 pixels in size
            // Assume point is left top
            // TODO set mask based on contour?

            if(it->points.size() == 0){
                continue;
            }

            // Fill only bounded area
            Rect b = boundingRect(Mat(it->points));
            Mat roi = morph_img(b);
            // Map seed point to boinding box coordinates
            p.x -=b.x;
            p.y -=b.y;
            floodFill(roi, p, Scalar(0), NULL, Scalar(0), Scalar(0));
        }
    }


    /*namedWindow("LemmeSee",1);
    imshow("LemmeSee", morph_img);
    waitKey(0);
    destroyAllWindows();*/

    // Restore original untarnished image
    cvtColor(img_rgb, image, CV_RGB2GRAY);

    // TODO the treshold should be determined

    // Despeckle for ocr
    //medianBlur(orig_gray, orig_gray, 5);

    // Threshold for ocr step
    //adaptiveThreshold(orig_gray, orig_gray, 255, ADAPTIVE_THRESH_MEAN_C,
    //        THRESH_BINARY, 7, 30);


    // Add features found in image to original. White features cancel them
    add(image, morph_img, temp_img);

    ocr_text(temp_img, image, features);

    //cvtColor(orig_gray, img_rgb, CV_GRAY2RGB);
}

