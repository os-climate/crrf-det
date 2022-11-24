#include "cpage_renderer.h"
#include "cpp/poppler-document-private.h"
#include "cpp/poppler-page-private.h"
#include "cpp/poppler-image.h"

//#include <config.h>

#include "PDFDoc.h"
#include "csplash_output_dev.h"
#include "splash/SplashBitmap.h"


using namespace poppler;


class poppler::page_renderer_private
{
public:
    page_renderer_private() : paper_color(0xffffffff), hints(0), image_format(image::format_enum::format_argb32), line_mode(page_renderer::line_mode_enum::line_default) { }
    static bool conv_color_mode(image::format_enum mode, SplashColorMode &splash_mode);
    static bool conv_line_mode(page_renderer::line_mode_enum mode, SplashThinLineMode &splash_mode);

    argb paper_color;
    unsigned int hints;
    image::format_enum image_format;
    page_renderer::line_mode_enum line_mode;
};


image cpage_renderer::render_page(const page *p, bool text_only, double xres, double yres, int x, int y, int w, int h, rotation_enum rotate) const
{
    if (!p) {
        return image();
    }

    page_private *pp = page_private::get(p);
    PDFDoc *pdfdoc = pp->doc->doc;

    SplashColorMode colorMode;
    SplashThinLineMode lineMode;

    if (!d->conv_color_mode(d->image_format, colorMode) || !d->conv_line_mode(d->line_mode, lineMode)) {
        return image();
    }

    SplashColor bgColor;
    bgColor[0] = d->paper_color & 0xff;
    bgColor[1] = (d->paper_color >> 8) & 0xff;
    bgColor[2] = (d->paper_color >> 16) & 0xff;
    csplash_output_dev splashOutputDev(text_only, colorMode, 4, false, bgColor, true, lineMode);
    splashOutputDev.setFontAntialias(d->hints & text_antialiasing ? true : false);
    splashOutputDev.setVectorAntialias(d->hints & antialiasing ? true : false);
    splashOutputDev.setFreeTypeHinting(d->hints & text_hinting ? true : false, false);
    splashOutputDev.startDoc(pdfdoc);
    pdfdoc->displayPageSlice(&splashOutputDev, pp->index + 1, xres, yres, int(rotate) * 90, false, true, false, x, y, w, h, nullptr, nullptr, nullptr, nullptr, true);

    SplashBitmap *bitmap = splashOutputDev.getBitmap();
    const int bw = bitmap->getWidth();
    const int bh = bitmap->getHeight();

    SplashColorPtr data_ptr = bitmap->getDataPtr();

    const image img(reinterpret_cast<char *>(data_ptr), bw, bh, d->image_format);
    return img.copy();
}
