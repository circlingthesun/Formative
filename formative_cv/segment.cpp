#include "segment.h"
//#include <baseapi.h>

using namespace std;
using namespace cv;
//using namespace tesseract;

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

void text_segment(Mat & image, vector<feature> & results){
    // smear the text with an elipse

    // Scale for ocr
    // 2480 X 3508 = 300 dpi
    /*int ref_x = 2480;
    int ref_y = 3508;
    double x_ra = (double)image.rows/ref_x;
    double y_ra = (double)image.cols/ref_y;
    double scale_factor = y_ra;
    if(x_ra > y_ra)
        scale_factor = x_ra;
    int cols = image.cols/scale_factor+0.5;
    int rows = image.rows/scale_factor+0.5;
    Mat ocr_img = Mat(Size(cols,rows), CV_8UC1);
    resize(image, ocr_img, Size(cols,rows));

    Mat ocr_img2 = ocr_img.clone();
    getStructuringElement(MORPH_CROSS, Size(5,5));


    // OCR
    TessBaseAPI api;
    api.Init("/usr/local/share", "eng", 0, 0, false);
    //api.SetPageSegMode(tesseract::PSM_SINGLE_WORD); // PSM_SINGLE_WORD PSM_AUTO
    api.SetPageSegMode(tesseract::PSM_AUTO);
    
    api.SetImage( (const unsigned char*) ocr_img.data,
        rows,
        cols,
        1, //image->depth,
        rows
    );

    api.SetRectangle(
    //x,y,w,h
        0,0,rows,cols
    );
                   
    char * text = api.GetUTF8Text();
    printf("%s\n", text);*/
}


// Traverse contour tree and mark relevant boxess
void classify(vector<vector<Point> >& contours, vector<Vec4i>& hierarchy,
        int width, int height, vector<feature> & result){

    // Some heuristics
    int minimum_line_len = width/18;
    int minimum_box_width = width/25;
    int min_box_size = (height*width)/(40*50);
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

        // Set child & sibling & parent
        child = hierarchy[current][2];
        next = hierarchy[current][0];
        parent = hierarchy[current][3];

        // When back tracking up the tree
        if(backtracking){
            if(next > 0){
                current = next;
                backtracking = false;
            }
            else{
                current = parent;
                level--;
            }
            continue;
        }

        // Set current contour
        vector<Point> & cont = contours[current];

        // New feature to be added to results
        feature element;
        element.points = cont;
        element.ftype = INVALID;

        // Current contour area
        double contour_area = fabs(contourArea(Mat(cont)));

        // Squares and rectangles have 4 points
        if(cont.size()==4 && contour_area > min_box_size){
            //printf("BOX\n");
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
            float delta = 0.5;
            
            if((ratio - 1) < delta)
                element.ftype = SQUARE;
            // Assume line 1 is horisontal
            else if(line1 > minimum_box_width)
                element.ftype = RECT;
        }
        
        // Lines have two points
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
                    length > minimum_line_len){
                element.ftype = LINE;
            }
        }

        // Assume things that have more points are text
        else{
            element.ftype = TEXT_BOX;
            element.points = cont;
        }

        // Dont add text inside text
        if(element.ftype != INVALID){
            result.push_back(element);
        }
         
        // All the work is done for the contour
        // Here we decide how to procede on the
        // next itteration

        // Dont recurse into text contour
        if(parent_type != TEXT_BOX){
            if(child > 0){
                current = child;
                level++;
            }
            else if(next > 0){
                current = next;
            }
            else{
                current = parent;
                backtracking = true;
                level--;
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
    Mat image = Mat(Size(img_rgb.cols, img_rgb.rows), CV_8UC1);
    cvtColor(img_rgb,image,CV_RGB2GRAY);

    // Reference image scale, this is the size at which
    // the algorithm has been found to work
    int ref_x = 1262;
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
    Mat resized_img = Mat(Size(cols,rows), CV_8UC1);
    resize(image, resized_img, Size(cols,rows));

    // Calculate the degree of smoothing required HACK!
    
    int kernel_size = 3;
    /*int avg_pix = sum(resized_img).val[0]/(double)(cols*rows);
    if(avg_pix < 190){
        kernel_size = 7;
    }*/
    
    // Smooth / despeckle image
    // Writeup: explain different choices
    // Guasian loses to much detail
    //GaussianBlur(resized_img, resized_img, Size(kernel_size, kernel_size), 0,0);

    //medianBlur(resized_img, resized_img,, 3);

    // Clean up via addaptive threshold
    // Why  ADAPTIVE_THRESH_MEAN_C or ADAPTIVE_THRESH_GAUSSIAN_C
    // How did I get to 7, 20?
    adaptiveThreshold(resized_img, resized_img, 255, ADAPTIVE_THRESH_MEAN_C,
            THRESH_BINARY, 7, 10);
    
    // Display purposes
    

    // Invert image so it represents edges?
    bitwise_not(resized_img, resized_img);

    // So lets connect the lines
    // Assumption that the image has been deskewed
    
    //dilate(resized_img, resized_img, cross_struct_el)

    // HEURISTICS
    int depth = 1;
    int size = 21; // was 21

    // Structuring elements...
    vector<Mat> structs(11);
    make_structuring_el(size, structs);
    int mid = size/2;

    // temp image used for all morph operations
    Mat temp_img = Mat(Size(cols,rows), CV_8UC1);
    Mat morph_img = Mat(Size(cols,rows), CV_8UC1, Scalar(0));

    // Find horisontal and vertical
    for(int i = 0; i < 2; i++){
        morphologyEx(resized_img, temp_img, MORPH_OPEN,
            structs[i], Point(-1, -1), depth);
        bitwise_or(temp_img, morph_img, morph_img);
    }

    resized_img = morph_img;

    /*size = 3;
    make_structuring_el(size, structs);
    mid = size/2;

    morph_img = Mat(Size(cols,rows), CV_8UC1, Scalar(0));
    // Find horisontal and vertical
    for(int i = 0; i < 11; i++){
        morphologyEx(resized_img, temp_img, MORPH_OPEN,
            structs[i], Point(mid, mid), depth);
        bitwise_or(temp_img, morph_img, morph_img);
    }

    resized_img = morph_img;
    */
    // Combine the vertical and horisontal components
    

    // Dillate with cross so we get better connections
    // DOES NOT WORK SINCE BORDERING NOISE GETS CONNECTED
    // INSTEAD TRY ALL CORNER TYPES
    Mat cross_struct_el = getStructuringElement(MORPH_CROSS, Size(3,3));
    dilate(resized_img, resized_img, cross_struct_el, Point(-1, -1), 1);

    // Create new horisontal structuring element & dillate
    // This takes care of dotted lines
    // TODO need better approach
    
    //Mat hor_line_st2(Size(1,3), CV_8U, Scalar(1));
    //dilate(resized_img, resized_img, structs[1], Point(-1, -1), 1);
    //morphologyEx(resized_img, resized_img, MORPH_OPEN,
    //        hor_line_st2, Point(-1, -1), 1);
     

    // Create large copy of original morphologically alterterd image
    // Will be used to subtract lines from image
    resize(resized_img, image, Size(img_rgb.cols, img_rgb.rows));

    // Find contours
    vector<vector <Point> > contours;
    vector<Vec4i> hierarchy;
    findContours(
        resized_img,
        contours,
        hierarchy,
        CV_RETR_TREE, // CV_RETR_CCOMP CV_RETR_EXTERNAL
        CV_CHAIN_APPROX_NONE
    );



    // Draw contours them
    //Scalar color( 0, 255, 0 );
    //drawContours( img_rgb, contours, -1, color, 2, 8, hierarchy );

    float approx_accuracy=0.02; // 0.2

    // Approximate contours
    vector<vector<Point> >::iterator itc=contours.begin();
    while (itc!=contours.end()) {

        vector<Point> & points = *itc;

        Mat curve(points, true);
        double arc_len = arcLength(curve,true);

        vector<Point> approx;

        approxPolyDP(
            curve,
            approx,
            arc_len*approx_accuracy,// was 5. accuracy of the approximation
            true // yes it is a closed shape
        );

        if(approx.size() > 1 && points.size() > 1){
            //points.clear();
            points = approx;
            ++itc;
        }
        else{
            // Eliminate too shortcontours
            itc= contours.erase(itc);
        }
    }

    // Scale my babies back to normal
    for( unsigned int i=0; i< contours.size(); i++ ) {
        vector<Point> & points = contours[i];

        for( unsigned  int j=0; j< points.size(); j++ ) {
            Point & p = points[j];
            p.x = p.x*scale_factor+0.5;
            p.y = p.y*scale_factor+0.5;
        }
    }

    // Classify
    vector<feature> * result = new vector<feature>();
    classify(contours, hierarchy, rows, cols, *result);

    // Flood fill out noise
    for(vector<feature>::iterator it = result->begin(); it != result->end(); it++){
        if(it->ftype == TEXT_BOX ){
            Point p = it->points[0];
            // Move the edge point onto the line
            // Assume at least 2 pixels in size
            // Assume point is left top
            // TODO set mask based on contour?
            floodFill(image, p, Scalar(0), 0, Scalar(0), Scalar(0));
            p.x +=1;
            p.y +=1;
            // TODO set mask based on contour?
            floodFill(image, p, Scalar(0), 0, Scalar(0), Scalar(0));
        }
    }

    // Subtract liness from original
    Mat orig_gray = Mat(Size(img_rgb.cols,img_rgb.rows), CV_8UC1);
    cvtColor(img_rgb, orig_gray, CV_RGB2GRAY);

    // TODO the treshold should be determined

    // Threshold for ocr step
    //adaptiveThreshold(orig_gray, orig_gray, 255, ADAPTIVE_THRESH_MEAN_C,
    //        THRESH_BINARY, 7, 10);

    // Despeckle for ocr
    //medianBlur(orig_gray, orig_gray, 5);

    add(image, orig_gray, image);

    //text_segment(image, *result);


    cvtColor(image, img_rgb, CV_GRAY2RGB);
    image.release();
    resized_img.release();
    return result;
}

