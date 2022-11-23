#include <string>
#include <vector>
#define private public
#include "cpp/poppler-document.h"
#undef private
#include "cpp/poppler-page.h"
#include "poppler-document-private.h"
#include "text_output_dev.h"
#include "cmd_page.h"

using namespace std;
using namespace poppler;


const double margin_base = 25.4 / 210.0; // an inch, https://support.office.com/en-us/article/set-or-change-page-margins-in-word-72fa6264-7df4-48f3-b805-2ffb6f32bd54
const double margin_narrow = margin_base * 0.4;
const double margin_normal = margin_base * 0.8;
const double margin_thin = margin_base * 0.25;


void command_text(poppler::document* doc, std::vector<int>& pages, std::string margin) {
    printf("[text]\n");
    double margin_ratio = margin_normal;
    if (margin == "narrow")
        margin_ratio = margin_narrow;
    for (size_t page_idx = 0; page_idx < pages.size(); page_idx++) {
        page* page_ = doc->create_page(pages[page_idx] - 1);
        rectf r = page_->page_rect();
        double delta = margin_ratio * r.right();
        double delta_narrow = margin_narrow * r.right();
        double delta_thin = margin_thin * r.right();
        r.set_left(delta_thin);
        r.set_right(r.right() - delta_thin);
        r.set_top(delta_narrow);
        r.set_bottom(r.bottom() - delta);
        // ustring text = page_->text(r);

        std::unique_ptr<GooString> s;
        ETextOutputDev td(false, 0, false, false, true);
        doc->d->doc->displayPage(&td, pages[page_idx], 72, 72, 0, false, true, false);
        s.reset(td.getText(r.left(), r.top(), r.right(), r.bottom()));

        printf("%s\n\x0c\n", s->c_str());
    }
}
