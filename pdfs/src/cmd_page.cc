#include <string>
#include <vector>
#define private public
#include "cpp/poppler-document.h"
#undef private
#include "cpp/poppler-page.h"
#include "cmd_page.h"

using namespace std;
using namespace poppler;


void command_page(poppler::document* doc, std::vector<int>& pages) {
    printf("[page]\n");
    for (size_t page_idx = 0; page_idx < pages.size(); page_idx++) {
        page* page_ = doc->create_page(pages[page_idx] - 1);
        page::orientation_enum orient = page_->orientation();
        rectf rect = page_->page_rect();
        printf("p%d %d (%4.2f x %4.2f)\n", pages[page_idx], orient, rect.right(), rect.bottom());
    }
}
