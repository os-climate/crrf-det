#include <map>
#include <vector>
#include <string>
#include <iostream>
#include <string.h>
#include <unistd.h>
#include <getopt.h>

#include "document.h"


using namespace std;


void print_usage() {
    printf("document multi-tool (docmt)\n");
    printf("usage: docmt -i <file> \n");
    printf("             [-p <page_desc>] [-o <base>]\n");
    printf("             [-P <image_ppi>] [-F jpg/png] [-M normal/narrow] [-A]\n");
    printf("             <command>\n");
}

vector<int> parse_pages(char *page_desc) {
    vector<int> pages;
    char *dash_pos = strstr(page_desc, "-");
    if (dash_pos) {
        // parse range
        char *range_left = strtok(page_desc, "-");
        char *range_right = strtok(NULL, "-");
        if (range_left &&
            range_right) {
            int rl = atoi(range_left);
            int rr = atoi(range_right);
            for (int i = rl; i <= rr; i++) {
                if (i > 0)
                    pages.push_back(i);
            }
        }
    } else {
        // parse individual pages by commas
        char *token = strtok(page_desc, ",");
        if (token) {
            int page = atoi(token);
            pages.push_back(page);
            while(token != NULL) {
                token = strtok(NULL, ",");
                if (token == NULL)
                    break;
                page = atoi(token);
                if (page == 0)
                    break;
                pages.push_back(page);
            }
        }
    }
    return pages;
}

int main(int argc, char *argv[]) {

    string input_file_name;
    string output_base_name;
    string render_format = "jpg";
    string margin = "normal";
    vector<string> commands;
    vector<int> pages;
    int image_ppi = 72;
    bool anti_aliased = true;

    int opt;
    while ((opt = getopt(argc, argv,"i:c:p:o:P:F:M:A")) != -1) {
        switch (opt) {
            case 'i':
                input_file_name = optarg;
                break;
            case 'p':
                pages = parse_pages(optarg);
                break;
            case 'o':
                output_base_name = optarg;
                break;
            case 'P':
                image_ppi = atoi(optarg);
                if (image_ppi == 0 ||
                    image_ppi > 800) {
                    image_ppi = 72;
                }
                break;
            case 'F':
                render_format = optarg;
                break;
            case 'M':
                margin = optarg;
                break;
            case 'A':
                anti_aliased = false;
                break;
            default:
                print_usage(); 
                exit(EXIT_FAILURE);
                break;
        }
    }
    for (; optind < argc; optind++) {
        commands.push_back(argv[optind]);
    }
    if (commands.size() == 0) {
        print_usage();
        exit(EXIT_FAILURE);
    }
    if (input_file_name.size() == 0) {
        print_usage();
        exit(EXIT_FAILURE);
    }

    document doc(input_file_name, pages);
    doc.print_essentials();
    for (size_t i = 0; i < commands.size(); i++) {
        doc.run_command(commands[i], output_base_name, image_ppi, render_format, anti_aliased, margin);
    }

    exit(EXIT_SUCCESS);
}
