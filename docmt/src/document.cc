#include <vector>
#include <string>
#include "document.h"
#include "cmd_preview.h"
#include "cmd_render.h"
#include "cmd_section.h"
#include "cmd_page.h"
#include "cmd_text.h"


void debug_output(const std::string &, void *) {
    // eat up message
}

document::document(std::string filename, std::vector<int> pages) {
    filename_ = filename;
    pdf_ = NULL;
    pages_ = pages;
    poppler::set_debug_error_function(debug_output, nullptr);
    pdf_ = poppler::document::load_from_file(filename);
    if (!pdf_) {
        printf("cannot read from input file %s\n", filename.c_str());
        exit(EXIT_FAILURE);
    }
    if (pages_.size() == 0) {
        pages_.resize(pdf_->pages());
        for (size_t i = 0; i < pages_.size(); i++)
            pages_[i] = i + 1;
    }
}

document::~document() {
}

void document::print_essentials() {
    printf("[essential]\n");
    if (pdf_) {
        int major = 0, minor = 0;
        pdf_->get_pdf_version(&major, &minor);
        printf("type pdf%d.%d\n", major, minor);
        printf("pages %d\n", pdf_->pages());
    } else {
        printf("type unknown\n");
    }
}

void document::run_command(std::string command, std::string output_base_name, int narrow_side_px, std::string render_format, bool anti_aliased, std::string margin, bool text_only) {
    if (command == "preview") {
        command_preview(pdf_, pages_);
    } else if (command == "render") {
        command_render(pdf_, pages_, output_base_name, narrow_side_px, render_format, anti_aliased, text_only);
    } else if (command == "section") {
        command_section(pdf_);
    } else if (command == "page") {
        command_page(pdf_, pages_);
    } else if (command == "text") {
        command_text(pdf_, pages_, margin);
    }
}
