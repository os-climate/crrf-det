//========================================================================
//
// ImageInfoDev.cc
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
// Copyright (C) 2005, 2007, 2011, 2018, 2019 Albert Astals Cid <aacid@kde.org>
// Copyright (C) 2006 Rainer Keller <class321@gmx.de>
// Copyright (C) 2008 Timothy Lee <timothy.lee@siriushk.com>
// Copyright (C) 2008 Vasile Gaburici <gaburici@cs.umd.edu>
// Copyright (C) 2009 Carlos Garcia Campos <carlosgc@gnome.org>
// Copyright (C) 2009 William Bader <williambader@hotmail.com>
// Copyright (C) 2010 Jakob Voss <jakob.voss@gbv.de>
// Copyright (C) 2012, 2013, 2017, 2018 Adrian Johnson <ajohnson@redneon.com>
// Copyright (C) 2013 Thomas Fischer <fischer@unix-ag.uni-kl.de>
// Copyright (C) 2013 Hib Eris <hib@hiberis.nl>
// Copyright (C) 2017 Caolán McNamara <caolanm@redhat.com>
// Copyright (C) 2018 Andreas Gruenbacher <agruenba@redhat.com>
//
// To see a description of the changes please see the Changelog file that
// came with your tarball or type make ChangeLog if you are building from git
//
//========================================================================

// #include "config.h"
#include <poppler-config.h>

#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>
#include <ctype.h>
#include <math.h>
#include "goo/gmem.h"
#include "Error.h"
#include "GfxState.h"
#include "Object.h"
#include "Stream.h"
#include "image_info_dev.h"

ImageInfoDev::ImageInfoDev() {
  imgNum = 0;
  pageNum = 0;
  ok = true;
  // printf("page   num  type   width height color comp bpc  enc interp  object ID x-ppi y-ppi size ratio\n");
  // printf("--------------------------------------------------------------------------------------------\n");
}


ImageInfoDev::~ImageInfoDev() {
}


void ImageInfoDev::listImage(GfxState *state, Object *ref, Stream *str,
             int width, int height,
             GfxImageColorMap *colorMap,
             bool interpolate, bool inlineImg,
             ImageType imageType) {
  ImageInstance imgi_;
  imgi_.width = width;
  imgi_.height = height;
  imgi_.page = pageNum;
  imgi_.index = imgNum;

  int components, bpc;

  // printf("%4d %5d ", pageNum, imgNum);
  imgi_.type = "";
  switch (imageType) {
  case imgImage:
    imgi_.type = "image";
    break;
  case imgStencil:
    imgi_.type = "stencil";
    break;
  case imgMask:
    imgi_.type = "mask";
    break;
  case imgSmask:
    imgi_.type = "smask";
    break;
  }
  // printf("%-7s %5d %5d  ", imgi_.type, imgi_.width, imgi_.height);

  imgi_.colorspace = "-";
  /* masks and stencils default to ncomps = 1 and bpc = 1 */
  imgi_.components = 1;
  imgi_.bpc = 1;
  if (colorMap && colorMap->isOk()) {
    switch (colorMap->getColorSpace()->getMode()) {
      case csDeviceGray:
      case csCalGray:
        imgi_.colorspace = "gray";
        break;
      case csDeviceRGB:
      case csCalRGB:
        imgi_.colorspace = "rgb";
        break;
      case csDeviceCMYK:
        imgi_.colorspace = "cmyk";
        break;
      case csLab:
        imgi_.colorspace = "lab";
        break;
      case csICCBased:
        imgi_.colorspace = "icc";
        break;
      case csIndexed:
        imgi_.colorspace = "index";
        break;
      case csSeparation:
        imgi_.colorspace = "sep";
        break;
      case csDeviceN:
        imgi_.colorspace = "devn";
        break;
      case csPattern:
      default:
        imgi_.colorspace = "-";
        break;
    }
    imgi_.components = colorMap->getNumPixelComps();
    imgi_.bpc = colorMap->getBits();
  }
  // printf("%-5s  %2d  %2d  ", imgi_.colorspace, imgi_.components, imgi_.bpc);

  switch (str->getKind()) {
  case strCCITTFax:
    imgi_.enc = "ccitt";
    break;
  case strDCT:
    imgi_.enc = "jpeg";
    break;
  case strJPX:
    imgi_.enc = "jpx";
    break;
  case strJBIG2:
    imgi_.enc = "jbig2";
    break;
  case strFile:
  case strFlate:
  case strCachedFile:
  case strASCIIHex:
  case strASCII85:
  case strLZW:
  case strRunLength:
  case strWeird:
  default:
    imgi_.enc = "image";
    break;
  }
  // printf("%-5s  ", imgi_.enc);

  const double *mat = state->getCTM();
  double width2 = mat[0] + mat[2];
  double height2 = mat[1] + mat[3];
  imgi_.xppi = fabs(width*72.0/width2) + 0.5;
  imgi_.yppi = fabs(height*72.0/height2) + 0.5;
  // if (imgi_.xppi < 1.0)
  //   printf("%5.3f ", imgi_.xppi);
  // else
  //   printf("%5.0f ", imgi_.xppi);
  // if (imgi_.yppi < 1.0)
  //   printf("%5.3f ", imgi_.yppi);
  // else
  //   printf("%5.0f ", imgi_.yppi);

  if (inlineImg)
    imgi_.size = getInlineImageLength(str, width, height, colorMap);
  else
    imgi_.size = str->getBaseStream()->getLength();

  // printf("\n");

  ++imgNum;

  imageInstances.push_back(imgi_);
}

long ImageInfoDev::getInlineImageLength(Stream *str, int width, int height,
                                          GfxImageColorMap *colorMap) {
  long len;

  if (colorMap) {
    ImageStream *imgStr = new ImageStream(str, width, colorMap->getNumPixelComps(),
                                          colorMap->getBits());
    imgStr->reset();
    for (int y = 0; y < height; y++)
      imgStr->getLine();

    imgStr->close();
    delete imgStr;
  } else {
    str->reset();
    for (int y = 0; y < height; y++) {
      int size = (width + 7)/8;
      for (int x = 0; x < size; x++)
        str->getChar();
    }
  }

  EmbedStream *embedStr = (EmbedStream *) (str->getBaseStream());
  embedStr->rewind();
  len = 0;
  while (embedStr->getChar() != EOF)
    len++;

  embedStr->restore();

  return len;
}

bool ImageInfoDev::tilingPatternFill(GfxState *state, Gfx *gfx, Catalog *cat, Object *str,
          const double *pmat, int paintType, int tilingType, Dict *resDict,
          const double *mat, const double *bbox,
          int x0, int y0, int x1, int y1,
          double xStep, double yStep) {
  return true;
  // do nothing -- this avoids the potentially slow loop in Gfx.cc
}

void ImageInfoDev::drawImageMask(GfxState *state, Object *ref, Stream *str,
           int width, int height, bool invert,
           bool interpolate, bool inlineImg) {
}

void ImageInfoDev::drawImage(GfxState *state, Object *ref, Stream *str,
             int width, int height,
             GfxImageColorMap *colorMap,
             bool interpolate, const int *maskColors, bool inlineImg) {
  listImage(state, ref, str, width, height, colorMap, interpolate, inlineImg, imgImage);
}

void ImageInfoDev::drawMaskedImage(
  GfxState *state, Object *ref, Stream *str,
  int width, int height, GfxImageColorMap *colorMap, bool interpolate,
  Stream *maskStr, int maskWidth, int maskHeight, bool maskInvert, bool maskInterpolate) {
  listImage(state, ref, str, width, height, colorMap, interpolate, false, imgImage);
}

void ImageInfoDev::drawSoftMaskedImage(
  GfxState *state, Object *ref, Stream *str,
  int width, int height, GfxImageColorMap *colorMap, bool interpolate,
  Stream *maskStr, int maskWidth, int maskHeight,
  GfxImageColorMap *maskColorMap, bool maskInterpolate) {
  listImage(state, ref, str, width, height, colorMap, interpolate, false, imgImage);
}

std::vector<ImageInstance>& ImageInfoDev::getImageInstances() {
  return imageInstances;
}
