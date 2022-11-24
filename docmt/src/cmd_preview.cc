#include <string>
#include <vector>
#include <iostream>
#define private public
#include "cpp/poppler-document.h"
#undef private
#include "cpp/poppler-page.h"
#include "poppler-document-private.h"
#include "cmd_preview.h"
#include "image_info_dev.h"


using namespace std;
using namespace poppler;


void command_preview(document* doc, vector<int>& pages) {
    const int PREVIEW_TEXT_LENGTH = 500;
    string preview_text;
    bool append_space = false;
    bool append_dot = false;

    ImageInfoDev *iidev = new ImageInfoDev();

    for (size_t page_idx = 0; page_idx < pages.size(); page_idx++) {
        page* page_ = doc->create_page(pages[page_idx] - 1);
        ustring text = page_->text();
        vector<char> text_utf8 = text.to_utf8();
        for (size_t i = 0; i < text_utf8.size(); i++) {
            switch (text_utf8[i]) {
            case ' ':
            case '\n':
            case '\t':
            case '\r':
                if (append_space)
                    preview_text += ' ';
                append_space = false;
                break;
            case '.':
                if (append_dot)
                    preview_text += '.';
                append_dot = false;
                break;
            default:
                preview_text += text_utf8[i];
                append_space = true;
                append_dot = true;
                break;
            }
            if (!append_space &&
                !append_dot &&
                preview_text.size() >= PREVIEW_TEXT_LENGTH)
                break;
        }
        doc->d->doc->displayPage(iidev, pages[page_idx], 72, 72, 0, true, false, false);
        if (preview_text.size() >= PREVIEW_TEXT_LENGTH)
            break;
    }

    printf("[preview:text]\n%s\n", preview_text.c_str());

    vector<ImageInstance> iis = iidev->getImageInstances();
    printf("[preview:image]\n");
    for (size_t img_idx = 0; img_idx < iis.size(); img_idx++) {
        printf("p%d i%d %d x %d (%d,%d) (%s,%s,%s) %5.3f %5.3f %d\n", iis[img_idx].page, iis[img_idx].index, iis[img_idx].width, iis[img_idx].height, iis[img_idx].components, iis[img_idx].bpc, iis[img_idx].type, iis[img_idx].colorspace, iis[img_idx].enc, iis[img_idx].xppi, iis[img_idx].yppi, iis[img_idx].size);

    }

    delete iidev;
}
