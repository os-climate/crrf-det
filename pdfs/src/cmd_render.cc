#include <vector>
#include <string>
#define private public
#include "cpp/poppler-document.h"
#undef private
#include "cpp/poppler-page.h"
#include "cpp/poppler-page-renderer.h"
#include "cmd_render.h"

using namespace poppler;


void command_render(poppler::document* doc, std::vector<int>& pages, std::string& output_base_name, int ppi, std::string render_format, bool anti_aliased) {

    if (render_format != "jpg" &&
        render_format != "png") {
        printf("cannot render to %s format\n", render_format.c_str());
        exit(EXIT_FAILURE);
    }

    printf("[render]\n");
    page_renderer renderer;
    if (anti_aliased)
        renderer.set_render_hints(page_renderer::text_antialiasing | page_renderer::text_hinting | page_renderer::antialiasing);
    char filename[512];
    for (size_t page_idx = 0; page_idx < pages.size(); page_idx++) {
        page* page_ = doc->create_page(pages[page_idx] - 1);
        image img = renderer.render_page(page_, ppi, ppi);
        snprintf(filename, 512, "%s.%d.%s", output_base_name.c_str(), pages[page_idx], render_format.c_str());
        bool success = false;
        FILE* fp_test = fopen(filename, "w");
        if (fp_test != NULL) {
            fclose(fp_test);
            success = img.save(filename, render_format);
        }
        if (success) {
            printf("saved image for page %d (%d x %d) to %s\n", pages[page_idx], img.width(), img.height(), filename);
        } else {
            printf("failed to save image for page %d (%d x %d) to %s\n", pages[page_idx], img.width(), img.height(), filename);
        }
    }

}