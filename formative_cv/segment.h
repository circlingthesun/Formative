#ifndef INFORM_SEGMENT
#define INFORM_SEGMENT

#include <vector>
#include <cv.h>
//#include <highgui.h>
#include <cvaux.h>
#include <math.h>

enum FType {LINE, RECT, SQUARE, TEXT, LOGO, UNCLASSIFIED, INVALID};
enum Movement{UP, DOWN, LEFT, RIGHT};

class Feature{
public:
    FType ftype;
    cv::Rect box;
    std::vector<cv::Point> points;
    std::string text;
    int input_limit;
    Feature * parent;
    Feature * child;
    Feature * prev;
    Feature * next;

    Feature(FType ftype,
		    cv::Rect box,
		    std::vector<cv::Point> points,
		    std::string text
			): ftype(ftype), box(box), points(points), text(text){
		    	this->input_limit = 0;
			    this->parent = NULL;
			    this->child = NULL;
			    this->prev = NULL;
			    this->next = NULL;
	}

	Feature(){
		this->ftype = INVALID;
		this->input_limit = 0;
		this->parent = NULL;
		this->child = NULL;
		this->prev = NULL;
		this->next = NULL;
	}

};

void segment(cv::Mat & image, std::vector<Feature> & features);

#endif // INFORM_SEGMENT
