#include <vector>
#include <string>
#define private public
#include "cpp/poppler-document.h"
#undef private
#include "cpp/poppler-toc.h"
#include "poppler-document-private.h"
#include "Link.h"
#include "Outline.h"
#include "cmd_section.h"


using namespace std;
using namespace poppler;


ustring unicode_to_ustring(const Unicode *u, int length)
{
    ustring str(length, 0);
    ustring::iterator it = str.begin();
    const Unicode *uu = u;
    for (int i = 0; i < length; ++i) {
        *it++ = ustring::value_type(*uu++ & 0xffff);
    }
    return str;
}

ustring unicode_GooString_to_ustring(const GooString *str)
{
    const char *data = str->c_str();
    const int len = str->getLength();

    const bool is_unicodeLE = str->hasUnicodeMarkerLE();
    const bool is_unicode = str->hasUnicodeMarker() || is_unicodeLE;
    int i = is_unicode ? 2 : 0;
    ustring::size_type ret_len = len - i;
    if (is_unicode) {
        ret_len >>= 1;
    }
    ustring ret(ret_len, 0);
    size_t ret_index = 0;
    ustring::value_type u;
    if (is_unicode) {
        while (i < len) {
            u = is_unicodeLE ? ((data[i + 1] & 0xff) << 8) | (data[i] & 0xff)
                             : ((data[i] & 0xff) << 8) | (data[i + 1] & 0xff);
            i += 2;
            ret[ret_index++] = u;
        }
    } else {
        while (i < len) {
            u = data[i] & 0xff;
            ++i;
            ret[ret_index++] = u;
        }
    }

    return ret;
}

void print_items(PDFDoc* doc, const vector<OutlineItem *> *items, int level) {
    for (size_t i = 0; i < items->size(); i++) {
        OutlineItem *item = (*items)[i];
        const Unicode *title_unicode = item->getTitle();
        const int title_length = item->getTitleLength();
        ustring title = unicode_to_ustring(title_unicode, title_length);

        for (int j = 0; j < level; j++)
            printf("> ");
        printf("%s", std::string(&title.to_utf8()[0], title.to_utf8().size()).c_str());
        const LinkAction *la = item->getAction();
        if (la &&
            la->getKind() == actionGoTo) {
            const LinkGoTo *lg = (const LinkGoTo *)la;
            const LinkDest *dest = lg->getDest();
            if (dest) {
                int pageNum = -1;
                if (dest->isPageRef()) {
                    pageNum = doc->findPage(dest->getPageRef());
                } else {
                    pageNum = dest->getPageNum();
                }
                printf(" p%d (%3.2f,%3.2f)", pageNum, dest->getLeft(), dest->getTop());
            }
        }
        printf("\n");

        item->open();
        const std::vector<OutlineItem*> *item_children = item->getKids();
        if (item_children) {
            print_items(doc, item_children, level + 1);
        }
    }
}

void command_section(poppler::document* doc) {
    printf("[section]\n");
    Outline *outline = doc->d->doc->getOutline();
    if (outline) {
        const vector<OutlineItem*> *items = outline->getItems();
        if (items)
            print_items(doc->d->doc, items, 0);
    }
}
