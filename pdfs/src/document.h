#ifndef DOCUMENT_H
#define DOCUMENT_H

#define private public
#include "cpp/poppler-document.h"
#undef private

class document {
public:
    document(std::string filename, std::vector<int> pages);
    ~document();

    void print_essentials();
    void run_command(std::string command, std::string output_base_name, int image_ppi, std::string render_format, bool anti_aliased, std::string margin);

private:
    poppler::document* pdf_;
    std::string filename_;
    std::vector<int> pages_;
};

#endif
