//========================================================================
//
// ImageInfoDev.h
//
// Copyright 1998-2003 Glyph & Cog, LLC
//
//========================================================================

//========================================================================
//
// Modified under the Poppler project - http://poppler.freedesktop.org
//
// All changes made under the Poppler project to this file are licensed
// under GPL version 2 or later
//
// Copyright (C) 2006 Rainer Keller <class321@gmx.de>
// Copyright (C) 2008 Timothy Lee <timothy.lee@siriushk.com>
// Copyright (C) 2009 Carlos Garcia Campos <carlosgc@gnome.org>
// Copyright (C) 2010 Jakob Voss <jakob.voss@gbv.de>
// Copyright (C) 2012, 2013, 2017 Adrian Johnson <ajohnson@redneon.com>
// Copyright (C) 2013 Thomas Freitag <Thomas.Freitag@alfa.de>
// Copyright (C) 2018 Albert Astals Cid <aacid@kde.org>
//
// To see a description of the changes please see the Changelog file that
// came with your tarball or type make ChangeLog if you are building from git
//
//========================================================================

#ifndef ImageInfoDev_H
#define ImageInfoDev_H

#include "poppler-config.h"

#include <vector>
#include <stdio.h>
#include "goo/ImgWriter.h"
#include "OutputDev.h"

class GfxState;

class ImageInstance {
public:
  const char *type;
  const char *colorspace;
  const char *enc;
  int page;
  int index;
  int components;
  int bpc;
  int width;
  int height;
  double xppi;
  double yppi;
  int size;
};

//------------------------------------------------------------------------
// ImageInfoDev
//------------------------------------------------------------------------

class ImageInfoDev: public OutputDev {
public:
  enum ImageType {
    imgImage,
    imgStencil,
    imgMask,
    imgSmask
  };
  enum ImageFormat {
    imgRGB,
    imgRGB48,
    imgGray,
    imgMonochrome,
    imgCMYK
  };

  ImageInfoDev();

  // Destructor.
  virtual ~ImageInfoDev();

  // Check if file was successfully created.
  virtual bool isOk() { return ok; }

  // Does this device use tilingPatternFill()?  If this returns false,
  // tiling pattern fills will be reduced to a series of other drawing
  // operations.
  bool useTilingPatternFill() override { return true; }

  // Does this device use beginType3Char/endType3Char?  Otherwise,
  // text in Type 3 fonts will be drawn with drawChar/drawString.
  bool interpretType3Chars() override { return false; }

  // Does this device need non-text content?
  bool needNonText() override { return true; }

  // Start a page
  void startPage(int pageNumA, GfxState *state, XRef *xref)  override
      { pageNum = pageNumA; }
 
  //---- get info about output device

  // Does this device use upside-down coordinates?
  // (Upside-down means (0,0) is the top left corner of the page.)
  bool upsideDown() override { return true; }

  // Does this device use drawChar() or drawString()?
  bool useDrawChar() override { return false; }

  //----- path painting
  bool tilingPatternFill(GfxState *state, Gfx *gfx, Catalog *cat, Object *str,
        const double *pmat, int paintType, int tilingType, Dict *resDict,
        const double *mat, const double *bbox,
        int x0, int y0, int x1, int y1,
        double xStep, double yStep) override;

  //----- image drawing
  void drawImageMask(GfxState *state, Object *ref, Stream *str,
         int width, int height, bool invert,
         bool interpolate, bool inlineImg) override;
  void drawImage(GfxState *state, Object *ref, Stream *str,
     int width, int height, GfxImageColorMap *colorMap,
     bool interpolate, const int *maskColors, bool inlineImg) override;
  void drawMaskedImage(GfxState *state, Object *ref, Stream *str,
           int width, int height,
           GfxImageColorMap *colorMap,
           bool interpolate,
           Stream *maskStr, int maskWidth, int maskHeight,
           bool maskInvert, bool maskInterpolate) override;
  void drawSoftMaskedImage(GfxState *state, Object *ref, Stream *str,
         int width, int height,
         GfxImageColorMap *colorMap,
         bool interpolate,
         Stream *maskStr,
         int maskWidth, int maskHeight,
         GfxImageColorMap *maskColorMap,
         bool maskInterpolate) override;

  std::vector<ImageInstance>& getImageInstances();

private:
  void listImage(GfxState *state, Object *ref, Stream *str,
     int width, int height,
     GfxImageColorMap *colorMap,
     bool interpolate, bool inlineImg,
     ImageType imageType);
  long getInlineImageLength(Stream *str, int width, int height, GfxImageColorMap *colorMap);

  int pageNum;      // current page number
  int imgNum;     // current image number
  bool ok;      // set up ok?
  std::vector<ImageInstance> imageInstances;
};

#endif
