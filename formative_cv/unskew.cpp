#include "unskew.h"

using namespace cv;

void unskew(Mat & img_rgb){

    // Create gray scale img
    Mat img_gray = Mat(Size(img_rgb.rows,img_rgb.cols), CV_8UC1);
    cvtColor(img_rgb,img_gray,CV_RGB2GRAY);

    // Reference image scale, this is the size at which
    // the algorithm has been found to work
    int ref_x = 1000;
    int ref_y = 1000;
    
    // Scale up/down to reference scale size
    double scale_factor;

    double x_ra = (double)img_gray.rows/ref_x;
    double y_ra = (double)img_gray.cols/ref_y;

    if(x_ra > y_ra)
        scale_factor = x_ra;
    else
        scale_factor = y_ra;

    int cols = img_gray.cols/scale_factor+0.5;
    int rows = img_gray.rows/scale_factor+0.5;
    
    // Create new resized image
    Mat resized_img = Mat(Size(cols,rows), CV_8UC1);
    resize(img_gray, resized_img, Size(cols,rows));


    // Clean up with blur
    GaussianBlur(resized_img, resized_img, Size(5, 5), 0,0);
        
    // Edge detection
    Canny(resized_img, resized_img, 200, 240, 3);
        
    // Find lines...
    
    vector<Vec2f> lines;
    double rho = 5; // rho resolution
    double theta = CV_PI/45; // theta resoltion
    int thresh = 100; // Threshold pixel votes

    // Needs heuristics
    HoughLines(resized_img, lines, rho, theta, thresh);
       
    int cres = 10000; // Resolution at which angles are counted
    int arr_size = (int)(cres*CV_PI);
    int * counts = new int[arr_size];

    for(int i=0; i < arr_size; i++){
        counts[i] = 0;
    }
    
    // Tollerated deviation angle of a horisontal line
    // Need to be careful so vertical lines re not detected
    float delta = CV_PI/3.5;
    float h_angle = CV_PI/2;
    
    // Find horisontal lines candidates
    for( size_t i = 0; i < lines.size(); i++ )
    {        
        // 0 is vertical pi/2 is horisontal
        float angle = lines[i][1];

        // Count for horisontal line candidates
        if(abs(angle) > h_angle-delta){
            angle = CV_PI/2 - angle;
            int cpos = (int)(((angle+CV_PI/2)*cres)+0.5);
            counts[cpos]++;
        }

    }
    
    // Find the angle with most support
    int max_pos = -1, max_val = 0;
    for(int i = 0; i < arr_size; i++){
        if (counts[i] > max_val){
            max_pos = i;
            max_val = counts[i];
        }
    }
    
    delete [] counts;

    // Reverse the offset and convert to degrees
    double offset_rad = max_pos/(double)cres;
    double abs_rad = offset_rad- CV_PI/2;
    double rotate_angle = abs_rad *57.2957795;

    // Find center 
    Point2f center(img_rgb.rows/2.0f, img_rgb.cols/2.0f);
    // Create rotation matrix
    Mat rot_mat = getRotationMatrix2D(center, rotate_angle, 1);

    // Rotate
    warpAffine( img_rgb.clone(), img_rgb, rot_mat, Size(img_rgb.cols, img_rgb.rows),
            INTER_LINEAR, BORDER_CONSTANT, Scalar(255, 255, 255)); 

    printf("Rotated: %f\n", rotate_angle);
}

