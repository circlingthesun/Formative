#ifndef INFORM_SEGMENT
#define INFORM_SEGMENT

#include <vector>
#include <cv.h>
#include <list>
#include <cvaux.h>
#include <math.h>

enum FType {LINE, RECT, SQUARE, TEXT, LOGO, UNCLASSIFIED, INVALID};

class Feature{
public:
	static float text_mean;
	static float text_std_dev;
	static int next_id;
	int id;
    FType type;
    cv::Rect box;
    std::vector<cv::Point> points;
    std::string text;
    int length; // For text fields
    Feature * parent;
    Feature * child;
    Feature * prev;
    Feature * next;
    Feature * label;

    Feature(FType type,
		    cv::Rect box,
		    std::vector<cv::Point> points,
		    std::string text
			): type(type), box(box), points(points), text(text){
				this->id = next_id++;
		    	this->length = 0;
			    this->parent = NULL;
			    this->child = NULL;
			    this->prev = NULL;
			    this->next = NULL;
			    this->label = NULL;
	}

	Feature(){
		this->id = next_id++;
		this->type = INVALID;
		this->length = 0;
		this->parent = NULL;
		this->child = NULL;
		this->prev = NULL;
		this->next = NULL;
		this->label = NULL;
	}


	// Compares features
    
    bool operator < (const Feature & rhs) const{

        cv::Rect box1 = cv::boundingRect(cv::Mat(this->points));
        cv::Rect box2 = cv::boundingRect(cv::Mat(rhs.points));

        if(box1.y+box1.height == box2.y+box2.height)
            return box1.x < box2.x;

        return box1.y+box1.height < box2.y+box2.height;
    }


};

void segment(cv::Mat & image, std::list<Feature> & features);

#endif // INFORM_SEGMENT
