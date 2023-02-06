#ifndef CPAGE_RENDERER_H_
#define CPAGE_RENDERER_H_


#include "cpp/poppler-global.h"
#include "cpp/poppler-image.h"

#define private protected
#include "cpp/poppler-page-renderer.h"
#undef private


class cpage_renderer : public poppler::page_renderer {
public:
    poppler::image render_page(const poppler::page *p, bool text_only, int narrow_side_px = 400, poppler::rotation_enum rotate = poppler::rotate_0) const;
};


#endif // CPAGE_RENDERER_H_
