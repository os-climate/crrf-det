#ifndef CPAGE_RENDERER_H_
#define CPAGE_RENDERER_H_


#include "cpp/poppler-global.h"
#include "cpp/poppler-image.h"

#define private protected
#include "cpp/poppler-page-renderer.h"
#undef private


class cpage_renderer : public poppler::page_renderer {
public:
    poppler::image render_page(const poppler::page *p, bool text_only, double xres = 72.0, double yres = 72.0, int x = -1, int y = -1, int w = -1, int h = -1, poppler::rotation_enum rotate = poppler::rotate_0) const;
};


#endif // CPAGE_RENDERER_H_
