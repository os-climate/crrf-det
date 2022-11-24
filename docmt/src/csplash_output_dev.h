#ifndef CSPLASH_OUT_DEV_H_
#define CSPLASH_OUT_DEV_H_


#define private protected
#include <SplashOutputDev.h>
#undef private


class csplash_output_dev : public SplashOutputDev {
public:
    csplash_output_dev(bool text_only, SplashColorMode colorModeA, int bitmapRowPadA, bool reverseVideoA, SplashColorPtr paperColorA, bool bitmapTopDownA = true, SplashThinLineMode thinLineMode = splashThinLineDefault,
                    bool overprintPreviewA = globalParams->getOverprintPreview());

    void stroke(GfxState *state) override;
    void fill(GfxState *state) override;
    void eoFill(GfxState *state) override;
    bool tilingPatternFill(GfxState *state, Gfx *gfx, Catalog *catalog, Object *str, const double *ptm, int paintType, int tilingType, Dict *resDict, const double *mat, const double *bbox, int x0, int y0, int x1, int y1, double xStep,
                           double yStep) override;
    bool functionShadedFill(GfxState *state, GfxFunctionShading *shading) override;
    bool axialShadedFill(GfxState *state, GfxAxialShading *shading, double tMin, double tMax) override;
    bool radialShadedFill(GfxState *state, GfxRadialShading *shading, double tMin, double tMax) override;
    bool gouraudTriangleShadedFill(GfxState *state, GfxGouraudTriangleShading *shading) override;

    void drawChar(GfxState *state, double x, double y, double dx, double dy, double originX, double originY, CharCode code, int nBytes, const Unicode *u, int uLen) override;

    void drawImageMask(GfxState *state, Object *ref, Stream *str, int width, int height, bool invert, bool interpolate, bool inlineImg) override;
    void setSoftMaskFromImageMask(GfxState *state, Object *ref, Stream *str, int width, int height, bool invert, bool inlineImg, double *baseMatrix) override;
    void unsetSoftMaskFromImageMask(GfxState *state, double *baseMatrix) override;
    void drawImage(GfxState *state, Object *ref, Stream *str, int width, int height, GfxImageColorMap *colorMap, bool interpolate, const int *maskColors, bool inlineImg) override;
    void drawMaskedImage(GfxState *state, Object *ref, Stream *str, int width, int height, GfxImageColorMap *colorMap, bool interpolate, Stream *maskStr, int maskWidth, int maskHeight, bool maskInvert, bool maskInterpolate) override;
    void drawSoftMaskedImage(GfxState *state, Object *ref, Stream *str, int width, int height, GfxImageColorMap *colorMap, bool interpolate, Stream *maskStr, int maskWidth, int maskHeight, GfxImageColorMap *maskColorMap,
                             bool maskInterpolate) override;

private:
    bool m_text_only;
};


#endif // CSPLASH_OUT_DEV_H_