#include "csplash_output_dev.h"

#include "splash/Splash.h"


csplash_output_dev::csplash_output_dev(bool text_only, SplashColorMode colorModeA, int bitmapRowPadA, bool reverseVideoA, SplashColorPtr paperColorA, bool bitmapTopDownA, SplashThinLineMode thinLineMode, bool overprintPreviewA):
    m_text_only(text_only),
    SplashOutputDev(colorModeA, bitmapRowPadA, reverseVideoA, paperColorA, bitmapTopDownA, thinLineMode, overprintPreviewA) {

}


void csplash_output_dev::stroke(GfxState *state) {
    if (!m_text_only)
        SplashOutputDev::stroke(state);
}


void csplash_output_dev::fill(GfxState *state) {
    if (!m_text_only)
        SplashOutputDev::fill(state);
}


void csplash_output_dev::eoFill(GfxState *state) {
    if (!m_text_only)
        SplashOutputDev::eoFill(state);
}


bool csplash_output_dev::tilingPatternFill(GfxState *state, Gfx *gfx, Catalog *catalog, Object *str, const double *ptm, int paintType, int tilingType, Dict *resDict, const double *mat, const double *bbox, int x0, int y0, int x1, int y1, double xStep, double yStep) {
    if (!m_text_only)
        return SplashOutputDev::tilingPatternFill(state, gfx, catalog, str, ptm, paintType, tilingType, resDict, mat, bbox, x0, y0, x1, y1, xStep, yStep);
    return false;
}


bool csplash_output_dev::functionShadedFill(GfxState *state, GfxFunctionShading *shading) {
    if (!m_text_only)
        return SplashOutputDev::functionShadedFill(state, shading);
    return false;
}


bool csplash_output_dev::axialShadedFill(GfxState *state, GfxAxialShading *shading, double tMin, double tMax) {
    if (!m_text_only)
        return SplashOutputDev::axialShadedFill(state, shading, tMin, tMax);
    return false;
}


bool csplash_output_dev::radialShadedFill(GfxState *state, GfxRadialShading *shading, double tMin, double tMax) {
    if (!m_text_only)
        return SplashOutputDev::radialShadedFill(state, shading, tMin, tMax);
    return false;
}


bool csplash_output_dev::gouraudTriangleShadedFill(GfxState *state, GfxGouraudTriangleShading *shading) {
    if (!m_text_only)
        return SplashOutputDev::gouraudTriangleShadedFill(state, shading);
    return false;
}


void csplash_output_dev::drawChar(GfxState *state, double x, double y, double dx, double dy, double originX, double originY, CharCode code, int nBytes, const Unicode *u, int uLen) {
    if (m_text_only) {
        SplashColor color = {0, 0, 0, 255};
        splash->setFillPattern(new SplashSolidColor(color));
        splash->setStrokePattern(new SplashSolidColor(color));
    }
    SplashOutputDev::drawChar(state, x, y, dx, dy, originX, originY, code, nBytes, u, uLen);
}


void csplash_output_dev::drawImageMask(GfxState *state, Object *ref, Stream *str, int width, int height, bool invert, bool interpolate, bool inlineImg) {
    if (!m_text_only)
        SplashOutputDev::drawImageMask(state, ref, str, width, height, invert, interpolate, inlineImg);
}


void csplash_output_dev::setSoftMaskFromImageMask(GfxState *state, Object *ref, Stream *str, int width, int height, bool invert, bool inlineImg, double *baseMatrix) {
    if (!m_text_only)
        SplashOutputDev::setSoftMaskFromImageMask(state, ref, str, width, height, invert, inlineImg, baseMatrix);
}


void csplash_output_dev::unsetSoftMaskFromImageMask(GfxState *state, double *baseMatrix) {
    if (!m_text_only)
        SplashOutputDev::unsetSoftMaskFromImageMask(state, baseMatrix);
}


void csplash_output_dev::drawImage(GfxState *state, Object *ref, Stream *str, int width, int height, GfxImageColorMap *colorMap, bool interpolate, const int *maskColors, bool inlineImg) {
    if (!m_text_only)
        SplashOutputDev::drawImage(state, ref, str, width, height, colorMap, interpolate, maskColors, inlineImg);
}


void csplash_output_dev::drawMaskedImage(GfxState *state, Object *ref, Stream *str, int width, int height, GfxImageColorMap *colorMap, bool interpolate, Stream *maskStr, int maskWidth, int maskHeight, bool maskInvert, bool maskInterpolate) {
    if (!m_text_only)
        SplashOutputDev::drawMaskedImage(state, ref, str, width, height, colorMap, interpolate, maskStr, maskWidth, maskHeight, maskInvert, maskInterpolate);
}


void csplash_output_dev::drawSoftMaskedImage(GfxState *state, Object *ref, Stream *str, int width, int height, GfxImageColorMap *colorMap, bool interpolate, Stream *maskStr, int maskWidth, int maskHeight, GfxImageColorMap *maskColorMap,
                             bool maskInterpolate) {
    if (!m_text_only)
        SplashOutputDev::drawSoftMaskedImage(state, ref, str, width, height, colorMap, interpolate, maskStr, maskWidth, maskHeight, maskColorMap, maskInterpolate);
}



