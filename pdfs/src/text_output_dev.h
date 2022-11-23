//========================================================================
//
// ETextOutputDev.h
//
// Copyright 1997-2003 Glyph & Cog, LLC
//
//========================================================================

//========================================================================
//
// Modified under the Poppler project - http://poppler.freedesktop.org
//
// All changes made under the Poppler project to this file are licensed
// under GPL version 2 or later
//
// Copyright (C) 2005-2007 Kristian Høgsberg <krh@redhat.com>
// Copyright (C) 2006 Ed Catmur <ed@catmur.co.uk>
// Copyright (C) 2007, 2008, 2011, 2013 Carlos Garcia Campos <carlosgc@gnome.org>
// Copyright (C) 2007, 2017 Adrian Johnson <ajohnson@redneon.com>
// Copyright (C) 2008, 2010, 2015, 2016, 2018 Albert Astals Cid <aacid@kde.org>
// Copyright (C) 2010 Brian Ewins <brian.ewins@gmail.com>
// Copyright (C) 2012, 2013, 2015, 2016 Jason Crain <jason@aquaticape.us>
// Copyright (C) 2013 Thomas Freitag <Thomas.Freitag@alfa.de>
// Copyright (C) 2018 Klarälvdalens Datakonsult AB, a KDAB Group company, <info@kdab.com>. Work sponsored by the LiMux project of the city of Munich
// Copyright (C) 2018 Sanchit Anand <sanxchit@gmail.com>
// Copyright (C) 2018 Nelson Benítez León <nbenitezl@gmail.com>
// Copyright (C) 2019 Oliver Sander <oliver.sander@tu-dresden.de>
// Copyright (C) 2019 Dan Shea <dan.shea@logical-innovations.com>
//
// To see a description of the changes please see the Changelog file that
// came with your tarball or type make ChangeLog if you are building from git
//
//========================================================================

#ifndef TEXTOUTPUTDEV_H
#define TEXTOUTPUTDEV_H

#include "poppler-config.h"
#include <stdio.h>
#include "GfxFont.h"
#include "GfxState.h"
#include "OutputDev.h"

class GooString;
class Gfx;
class GfxFont;
class GfxState;
class UnicodeMap;
class AnnotLink;

class ETextWord;
class ETextPool;
class ETextLine;
class ETextLineFrag;
class ETextBlock;
class ETextFlow;
class ETextLink;
class ETextUnderline;
class ETextWordList;
class ETextPage;
class ETextSelectionVisitor;

//------------------------------------------------------------------------

enum SelectionStyle {
  selectionStyleGlyph,
  selectionStyleWord,
  selectionStyleLine
};

enum EndOfLineKind
{
    eolUnix, // LF
    eolDOS, // CR+LF
    eolMac // CR
};

//------------------------------------------------------------------------
// ETextFontInfo
//------------------------------------------------------------------------

class ETextFontInfo {
public:

  ETextFontInfo(GfxState *state);
  ~ETextFontInfo();

  ETextFontInfo(const ETextFontInfo &) = delete;
  ETextFontInfo& operator=(const ETextFontInfo &) = delete;

  bool matches(GfxState *state) const;
  bool matches(const ETextFontInfo *fontInfo) const;

  // Get the font ascent, or a default value if the font is not set
  double getAscent() const;

  // Get the font descent, or a default value if the font is not set
  double getDescent() const;

  // Get the writing mode (0 or 1), or 0 if the font is not set
  int getWMode() const;

#ifdef TEXTOUT_WORD_LIST
  // Get the font name (which may be NULL).
  const GooString *getFontName() const { return fontName; }

  // Get font descriptor flags.
  bool isFixedWidth() const { return flags & fontFixedWidth; }
  bool isSerif() const { return flags & fontSerif; }
  bool isSymbolic() const { return flags & fontSymbolic; }
  bool isItalic() const { return flags & fontItalic; }
  bool isBold() const { return flags & fontBold; }
#endif

private:

  GfxFont *gfxFont;
#ifdef TEXTOUT_WORD_LIST
  GooString *fontName;
  int flags;
#endif

  friend class ETextWord;
  friend class ETextPage;
  friend class ETextSelectionPainter;
};

//------------------------------------------------------------------------
// ETextWord
//------------------------------------------------------------------------

class ETextWord {
public:

  // Constructor.
  ETextWord(const GfxState *state, int rotA, double fontSize);

  // Destructor.
  ~ETextWord();

  ETextWord(const ETextWord &) = delete;
  ETextWord& operator=(const ETextWord &) = delete;

  // Add a character to the word.
  void addChar(GfxState *state, ETextFontInfo *fontA, double x, double y,
         double dx, double dy, int charPosA, int charLen,
         CharCode c, Unicode u, const Matrix &textMatA);

  // Attempt to add a character to the word as a combining character.
  // Either character u or the last character in the word must be an
  // acute, dieresis, or other combining character.  Returns true if
  // the character was added.
  bool addCombining(GfxState *state, ETextFontInfo *fontA, double fontSizeA, double x, double y,
         double dx, double dy, int charPosA, int charLen,
         CharCode c, Unicode u, const Matrix &textMatA);

  // Merge <word> onto the end of <this>.
  void merge(ETextWord *word);

  // Compares <this> to <word>, returning -1 (<), 0 (=), or +1 (>),
  // based on a primary-axis comparison, e.g., x ordering if rot=0.
  int primaryCmp(ETextWord *word);

  // Return the distance along the primary axis between <this> and
  // <word>.
  double primaryDelta(ETextWord *word);

  static int cmpYX(const void *p1, const void *p2);

  void visitSelection(ETextSelectionVisitor *visitor,
          PDFRectangle *selection,
          SelectionStyle style);

  // Get the ETextFontInfo object associated with a character.
  ETextFontInfo *getFontInfo(int idx) { return font[idx]; }

  // Get the next ETextWord on the linked list.
  ETextWord *getNext() { return next; }

#ifdef TEXTOUT_WORD_LIST
  int getLength() { return len; }
  const Unicode *getChar(int idx) { return &text[idx]; }
  GooString *getText();
  GooString *getFontName(int idx) { return font[idx]->fontName; }
  void getColor(double *r, double *g, double *b)
    { *r = colorR; *g = colorG; *b = colorB; }
  void getBBox(double *xMinA, double *yMinA, double *xMaxA, double *yMaxA)
    { *xMinA = xMin; *yMinA = yMin; *xMaxA = xMax; *yMaxA = yMax; }
  void getCharBBox(int charIdx, double *xMinA, double *yMinA,
       double *xMaxA, double *yMaxA);
  double getFontSize() { return fontSize; }
  int getRotation() { return rot; }
  int getCharPos() { return charPos[0]; }
  int getCharLen() { return charPos[len] - charPos[0]; }
  bool getSpaceAfter() { return spaceAfter; }
#endif
  bool isUnderlined() { return underlined; }
  AnnotLink *getLink() { return link; }
  double getEdge(int i) { return edge[i]; }
  double getBaseline () { return base; }
  bool hasSpaceAfter  () { return spaceAfter; }
  ETextWord* nextWord () { return next; };
private:
  void ensureCapacity(int capacity);
  void setInitialBounds(ETextFontInfo *fontA, double x, double y);

  int rot;      // rotation, multiple of 90 degrees
        //   (0, 1, 2, or 3)
  int wMode;      // horizontal (0) or vertical (1) writing mode
  double xMin, xMax;    // bounding box x coordinates
  double yMin, yMax;    // bounding box y coordinates
  double base;      // baseline x or y coordinate
  Unicode *text;    // the text
  CharCode *charcode;   // glyph indices
  double *edge;     // "near" edge x or y coord of each char
        //   (plus one extra entry for the last char)
  int *charPos;     // character position (within content stream)
        //   of each char (plus one extra entry for
        //   the last char)
  int len;      // length of text/edge/charPos/font arrays
  int size;     // size of text/edge/charPos/font arrays
  ETextFontInfo **font;   // font information for each char
  Matrix *textMat;    // transformation matrix for each char
  double fontSize;    // font size
  bool spaceAfter;    // set if there is a space between this
        //   word and the next word on the line
  bool underlined;
  ETextWord *next;    // next word in line

#ifdef TEXTOUT_WORD_LIST
  double colorR,    // word color
         colorG,
         colorB;
#endif

  AnnotLink *link;

  friend class ETextPool;
  friend class ETextLine;
  friend class ETextBlock;
  friend class ETextFlow;
  friend class ETextWordList;
  friend class ETextPage;

  friend class ETextSelectionPainter;
  friend class ETextSelectionDumper;
};

//------------------------------------------------------------------------
// ETextPool
//------------------------------------------------------------------------

class ETextPool {
public:

  ETextPool();
  ~ETextPool();

  ETextPool(const ETextPool &) = delete;
  ETextPool& operator=(const ETextPool &) = delete;

  ETextWord *getPool(int baseIdx) { return pool[baseIdx - minBaseIdx]; }
  void setPool(int baseIdx, ETextWord *p) { pool[baseIdx - minBaseIdx] = p; }

  int getBaseIdx(double base);

  void addWord(ETextWord *word);

private:

  int minBaseIdx;   // min baseline bucket index
  int maxBaseIdx;   // max baseline bucket index
  ETextWord **pool;   // array of linked lists, one for each
        //   baseline value (multiple of 4 pts)
  ETextWord *cursor;    // pointer to last-accessed word
  int cursorBaseIdx;    // baseline bucket index of last-accessed word

  friend class ETextBlock;
  friend class ETextPage;
};

struct ETextFlowData;

//------------------------------------------------------------------------
// ETextLine
//------------------------------------------------------------------------

class ETextLine {
public:

  ETextLine(ETextBlock *blkA, int rotA, double baseA);
  ~ETextLine();

  ETextLine(const ETextLine &) = delete;
  ETextLine& operator=(const ETextLine &) = delete;

  void addWord(ETextWord *word);

  // Return the distance along the primary axis between <this> and
  // <line>.
  double primaryDelta(ETextLine *line);

  // Compares <this> to <line>, returning -1 (<), 0 (=), or +1 (>),
  // based on a primary-axis comparison, e.g., x ordering if rot=0.
  int primaryCmp(ETextLine *line);

  // Compares <this> to <line>, returning -1 (<), 0 (=), or +1 (>),
  // based on a secondary-axis comparison of the baselines, e.g., y
  // ordering if rot=0.
  int secondaryCmp(ETextLine *line);

  int cmpYX(ETextLine *line);

  static int cmpXY(const void *p1, const void *p2);

  void coalesce(const UnicodeMap *uMap);

  void visitSelection(ETextSelectionVisitor *visitor,
          PDFRectangle *selection,
          SelectionStyle style);

  // Get the head of the linked list of ETextWords.
  ETextWord *getWords() { return words; }

  // Get the next ETextLine on the linked list.
  ETextLine *getNext() { return next; }

  // Returns true if the last char of the line is a hyphen.
  bool isHyphenated() { return hyphenated; }

private:

  ETextBlock *blk;    // parent block
  int rot;      // text rotation
  double xMin, xMax;    // bounding box x coordinates
  double yMin, yMax;    // bounding box y coordinates
  double base;      // baseline x or y coordinate
  ETextWord *words;   // words in this line
  ETextWord *lastWord;    // last word in this line
  Unicode *text;    // Unicode text of the line, including
        //   spaces between words
  double *edge;     // "near" edge x or y coord of each char
        //   (plus one extra entry for the last char)
  int *col;     // starting column number of each Unicode char
  int len;      // number of Unicode chars
  int convertedLen;   // total number of converted characters
  bool hyphenated;    // set if last char is a hyphen
  ETextLine *next;    // next line in block
  Unicode *normalized;    // normalized form of Unicode text
  int normalized_len;   // number of normalized Unicode chars
  int *normalized_idx;    // indices of normalized chars into Unicode text
  Unicode *ascii_translation; // ascii translation from the normalized text
  int ascii_len;    // length of ascii translation text
  int *ascii_idx;   // indices of ascii chars into Unicode text of line

  friend class ETextLineFrag;
  friend class ETextBlock;
  friend class ETextFlow;
  friend class ETextWordList;
  friend class ETextPage;

  friend class ETextSelectionPainter;
  friend class ETextSelectionSizer;
  friend class ETextSelectionDumper;
};

//------------------------------------------------------------------------
// ETextBlock
//------------------------------------------------------------------------

class ETextBlock {
public:

  ETextBlock(ETextPage *pageA, int rotA);
  ~ETextBlock();

  ETextBlock(const ETextBlock &) = delete;
  ETextBlock& operator=(const ETextBlock &) = delete;

  void addWord(ETextWord *word);

  void coalesce(const UnicodeMap *uMap, double fixedPitch);

  // Update this block's priMin and priMax values, looking at <blk>.
  void updatePriMinMax(ETextBlock *blk);

  static int cmpXYPrimaryRot(const void *p1, const void *p2);

  static int cmpYXPrimaryRot(const void *p1, const void *p2);

  int primaryCmp(ETextBlock *blk);

  double secondaryDelta(ETextBlock *blk);

  // Returns true if <this> is below <blk>, relative to the page's
  // primary rotation.
  bool isBelow(ETextBlock *blk);

  void visitSelection(ETextSelectionVisitor *visitor,
          PDFRectangle *selection,
          SelectionStyle style);

  // Get the head of the linked list of ETextLines.
  ETextLine *getLines() { return lines; }

  // Get the next ETextBlock on the linked list.
  ETextBlock *getNext() { return next; }

  void getBBox(double *xMinA, double *yMinA, double *xMaxA, double *yMaxA)
    { *xMinA = xMin; *yMinA = yMin; *xMaxA = xMax; *yMaxA = yMax; }

  int getLineCount() { return nLines; }

private:

  bool isBeforeByRule1(ETextBlock *blk1);
  bool isBeforeByRepeatedRule1(ETextBlock *blkList, ETextBlock *blk1);
  bool isBeforeByRule2(ETextBlock *blk1);

  int visitDepthFirst(ETextBlock *blkList, int pos1,
          ETextBlock **sorted, int sortPos,
          bool* visited);
  int visitDepthFirst(ETextBlock *blkList, int pos1,
          ETextBlock **sorted, int sortPos,
          bool* visited,
          ETextBlock **cache, int cacheSize);

  ETextPage *page;    // the parent page
  int rot;      // text rotation
  double xMin, xMax;    // bounding box x coordinates
  double yMin, yMax;    // bounding box y coordinates
  double priMin, priMax;  // whitespace bounding box along primary axis
  double ExMin, ExMax;    // extended bounding box x coordinates
  double EyMin, EyMax;    // extended bounding box y coordinates
  int tableId;      // id of table to which this block belongs
  bool tableEnd;    // is this block at end of line of actual table

  ETextPool *pool;    // pool of words (used only until lines
        //   are built)
  ETextLine *lines;   // linked list of lines
  ETextLine *curLine;   // most recently added line
  int nLines;     // number of lines
  int charCount;    // number of characters in the block
  int col;      // starting column
  int nColumns;     // number of columns in the block

  ETextBlock *next;
  ETextBlock *stackNext;

  friend class ETextLine;
  friend class ETextLineFrag;
  friend class ETextFlow;
  friend class ETextWordList;
  friend class ETextPage;
  friend class ETextSelectionPainter;
  friend class ETextSelectionDumper;
};

//------------------------------------------------------------------------
// ETextFlow
//------------------------------------------------------------------------

class ETextFlow {
public:

  ETextFlow(ETextPage *pageA, ETextBlock *blk);
  ~ETextFlow();

  ETextFlow(const ETextFlow &) = delete;
  ETextFlow& operator=(const ETextFlow &) = delete;

  // Add a block to the end of this flow.
  void addBlock(ETextBlock *blk);

  // Returns true if <blk> fits below <prevBlk> in the flow, i.e., (1)
  // it uses a font no larger than the last block added to the flow,
  // and (2) it fits within the flow's [priMin, priMax] along the
  // primary axis.
  bool blockFits(ETextBlock *blk, ETextBlock *prevBlk);

  // Get the head of the linked list of ETextBlocks.
  ETextBlock *getBlocks() { return blocks; }

  // Get the next ETextFlow on the linked list.
  ETextFlow *getNext() { return next; }

private:

  ETextPage *page;    // the parent page
  double xMin, xMax;    // bounding box x coordinates
  double yMin, yMax;    // bounding box y coordinates
  double priMin, priMax;  // whitespace bounding box along primary axis
  ETextBlock *blocks;   // blocks in flow
  ETextBlock *lastBlk;    // last block in this flow
  ETextFlow *next;

  friend class ETextWordList;
  friend class ETextPage;
};

#ifdef TEXTOUT_WORD_LIST

//------------------------------------------------------------------------
// ETextWordList
//------------------------------------------------------------------------

class ETextWordList {
public:

  // Build a flat word list, in content stream order (if
  // text->rawOrder is true), physical layout order (if <physLayout>
  // is true and text->rawOrder is false), or reading order (if both
  // flags are false).
  ETextWordList(ETextPage *text, bool physLayout);

  ~ETextWordList();

  ETextWordList(const ETextWordList &) = delete;
  ETextWordList& operator=(const ETextWordList &) = delete;

  // Return the number of words on the list.
  int getLength();

  // Return the <idx>th word from the list.
  ETextWord *get(int idx);

private:

  std::vector<ETextWord*> *words;
};

#endif // TEXTOUT_WORD_LIST

class ETextWordSelection {
public:
  ETextWordSelection(ETextWord *wordA, int beginA, int endA)
    : word(wordA), begin(beginA), end(endA)
  {
  }

  ETextWord * getWord() const { return word; }
  int getBegin() const { return begin; }
  int getEnd() const { return end; }

private:
  ETextWord *word;
  int begin;
  int end;

  friend class ETextSelectionPainter;
  friend class ETextSelectionDumper;
};

//------------------------------------------------------------------------
// ETextPage
//------------------------------------------------------------------------

class ETextPage {
public:

  // Constructor.
  ETextPage(bool rawOrderA, bool discardDiagA = false);

  ETextPage(const ETextPage &) = delete;
  ETextPage& operator=(const ETextPage &) = delete;

  void incRefCnt();
  void decRefCnt();

  // Start a new page.
  void startPage(GfxState *state);

  // End the current page.
  void endPage();

  // Update the current font.
  void updateFont(GfxState *state);

  // Begin a new word.
  void beginWord(GfxState *state);

  // Add a character to the current word.
  void addChar(GfxState *state, double x, double y,
         double dx, double dy,
         CharCode c, int nBytes, const Unicode *u, int uLen);

  // Add <nChars> invisible characters.
  void incCharCount(int nChars);

  // End the current word, sorting it into the list of words.
  void endWord();

  // Add a word, sorting it into the list of words.
  void addWord(ETextWord *word);

  // Add a (potential) underline.
  void addUnderline(double x0, double y0, double x1, double y1);

  // Add a hyperlink.
  void addLink(int xMin, int yMin, int xMax, int yMax, AnnotLink *link);

  // Coalesce strings that look like parts of the same line.
  void coalesce(bool physLayout, double fixedPitch, bool doHTML);

  // Find a string.  If <startAtTop> is true, starts looking at the
  // top of the page; else if <startAtLast> is true, starts looking
  // immediately after the last find result; else starts looking at
  // <xMin>,<yMin>.  If <stopAtBottom> is true, stops looking at the
  // bottom of the page; else if <stopAtLast> is true, stops looking
  // just before the last find result; else stops looking at
  // <xMax>,<yMax>.
  bool findEText(Unicode *s, int len,
     bool startAtTop, bool stopAtBottom,
     bool startAtLast, bool stopAtLast,
     bool caseSensitive, bool backward,
     bool wholeWord,
     double *xMin, double *yMin,
     double *xMax, double *yMax);

  // Adds new parameter ignoreDiacritics, which will do diacritics
  // insensitive search, i.e. ignore accents, umlauts, diaeresis,etc.
  // while matching. This option will be ignored if <s> contains characters
  // which are not pure ascii.
  bool findEText(Unicode *s, int len,
     bool startAtTop, bool stopAtBottom,
     bool startAtLast, bool stopAtLast,
     bool caseSensitive, bool ignoreDiacritics,
     bool backward, bool wholeWord,
     double *xMin, double *yMin,
     double *xMax, double *yMax);

  // Get the text which is inside the specified rectangle.
  GooString *getText(double xMin, double yMin, double xMax, double yMax, EndOfLineKind textEOL) const;

  void visitSelection(ETextSelectionVisitor *visitor,
          PDFRectangle *selection,
          SelectionStyle style);

  void drawSelection(OutputDev *out,
         double scale,
         int rotation,
         PDFRectangle *selection,
         SelectionStyle style,
         GfxColor *glyph_color, GfxColor *box_color);

  std::vector<PDFRectangle*> *getSelectionRegion(PDFRectangle *selection,
            SelectionStyle style,
            double scale);

  GooString *getSelectionEText(PDFRectangle *selection,
            SelectionStyle style);

  std::vector<ETextWordSelection*> **getSelectionWords(PDFRectangle *selection,
                              SelectionStyle style,
                              int *nLines);

  // Find a string by character position and length.  If found, sets
  // the text bounding rectangle and returns true; otherwise returns
  // false.
  bool findCharRange(int pos, int length,
          double *xMin, double *yMin,
          double *xMax, double *yMax);

  // Get the head of the linked list of ETextFlows.
  ETextFlow *getFlows() { return flows; }

  // If true, will combine characters when a base and combining
  // character are drawn on eachother.
  void setMergeCombining(bool merge);

#ifdef TEXTOUT_WORD_LIST
  // Build a flat word list, in content stream order (if
  // this->rawOrder is true), physical layout order (if <physLayout>
  // is true and this->rawOrder is false), or reading order (if both
  // flags are false).
  ETextWordList *makeWordList(bool physLayout);
#endif

private:
  
  // Destructor.
  ~ETextPage();
  
  void clear();
  void assignColumns(ETextLineFrag *frags, int nFrags, bool rot) const;
  int dumpFragment(Unicode *text, int len, const UnicodeMap *uMap, GooString *s) const;

  bool rawOrder;    // keep text in content stream order
  bool discardDiag;   // discard diagonal text
  bool mergeCombining;    // merge when combining and base characters
        // are drawn on top of each other

  double pageWidth, pageHeight; // width and height of current page
  ETextWord *curWord;   // currently active string
  int charPos;      // next character position (within content
        //   stream)
  ETextFontInfo *curFont; // current font
  double curFontSize;   // current font size
  int nest;     // current nesting level (for Type 3 fonts)
  int nTinyChars;   // number of "tiny" chars seen so far
  bool lastCharOverlap; // set if the last added char overlapped the
        //   previous char
  bool diagonal;    // whether the current text is diagonal

  ETextPool *pools[4];    // a "pool" of ETextWords for each rotation
  ETextFlow *flows;   // linked list of flows
  ETextBlock **blocks;    // array of blocks, in yx order
  int nBlocks;      // number of blocks
  int primaryRot;   // primary rotation
  bool primaryLR;   // primary direction (true means L-to-R,
        //   false means R-to-L)
  ETextWord *rawWords;    // list of words, in raw order (only if
        //   rawOrder is set)
  ETextWord *rawLastWord; // last word on rawWords list

  std::vector<ETextFontInfo*> *fonts;// all font info objects used on this page

  double lastFindXMin,    // coordinates of the last "find" result
         lastFindYMin;
  bool haveLastFind;

  std::vector<ETextUnderline*> *underlines;
  std::vector<ETextLink*> *links;

  int refCnt;

  friend class ETextLine;
  friend class ETextLineFrag;
  friend class ETextBlock;
  friend class ETextFlow;
  friend class ETextWordList;
  friend class ETextSelectionPainter;
  friend class ETextSelectionDumper;
};

//------------------------------------------------------------------------
// ActualEText
//------------------------------------------------------------------------

class ActualEText {
public:
  // Create an ActualEText
  ActualEText(ETextPage *out);
  ~ActualEText();

  ActualEText(const ActualEText &) = delete;
  ActualEText& operator=(const ActualEText &) = delete;

  void addChar(GfxState *state, double x, double y,
         double dx, double dy,
         CharCode c, int nBytes, const Unicode *u, int uLen);
  void begin(GfxState *state, const GooString *text);
  void end(GfxState *state);

private:
  ETextPage *text;

  GooString *actualEText;        // replacement text for the span
  double actualETextX0;
  double actualETextY0;
  double actualETextX1;
  double actualETextY1;
  int actualETextNBytes;
};
  

//------------------------------------------------------------------------
// ETextOutputDev
//------------------------------------------------------------------------

class ETextOutputDev: public OutputDev {
public:

  // Open a text output file.  If <fileName> is NULL, no file is
  // written (this is useful, e.g., for searching text).  If
  // <physLayoutA> is true, the original physical layout of the text
  // is maintained.  If <rawOrder> is true, the text is kept in
  // content stream order.  If <discardDiag> is true, diagonal text
  // is removed from output.
  ETextOutputDev(bool physLayoutA,
    double fixedPitchA, bool rawOrderA,
    bool append, bool discardDiagA = false);

  // Destructor.
  ~ETextOutputDev();

  // Check if file was successfully created.
  virtual bool isOk() { return ok; }

  //---- get info about output device

  // Does this device use upside-down coordinates?
  // (Upside-down means (0,0) is the top left corner of the page.)
  bool upsideDown() override { return true; }

  // Does this device use drawChar() or drawString()?
  bool useDrawChar() override { return true; }

  // Does this device use beginType3Char/endType3Char?  Otherwise,
  // text in Type 3 fonts will be drawn with drawChar/drawString.
  bool interpretType3Chars() override { return false; }

  // Does this device need non-text content?
  bool needNonText() override { return false; }

  // Does this device require incCharCount to be called for text on
  // non-shown layers?
  bool needCharCount() override { return true; }

  //----- initialization and control

  // Start a page.
  void startPage(int pageNum, GfxState *state, XRef *xref) override;

  // End a page.
  void endPage() override;

  //----- save/restore graphics state
  void restoreState(GfxState *state) override;

  //----- update text state
  void updateFont(GfxState *state) override;

  //----- text drawing
  void beginString(GfxState *state, const GooString *s) override;
  void endString(GfxState *state) override;
  void drawChar(GfxState *state, double x, double y,
    double dx, double dy,
    double originX, double originY,
    CharCode c, int nBytes, const Unicode *u, int uLen) override;
  void incCharCount(int nChars) override;
  void beginActualText(GfxState *state, const GooString *text) override;
  void endActualText(GfxState *state) override;

  //----- path painting
  void stroke(GfxState *state) override;
  void fill(GfxState *state) override;
  void eoFill(GfxState *state) override;

  //----- link borders
  void processLink(AnnotLink *link) override;

  //----- special access

  // Find a string.  If <startAtTop> is true, starts looking at the
  // top of the page; else if <startAtLast> is true, starts looking
  // immediately after the last find result; else starts looking at
  // <xMin>,<yMin>.  If <stopAtBottom> is true, stops looking at the
  // bottom of the page; else if <stopAtLast> is true, stops looking
  // just before the last find result; else stops looking at
  // <xMax>,<yMax>.
  bool findEText(Unicode *s, int len,
     bool startAtTop, bool stopAtBottom,
     bool startAtLast, bool stopAtLast,
     bool caseSensitive, bool backward,
     bool wholeWord,
     double *xMin, double *yMin,
     double *xMax, double *yMax);

  // Get the text which is inside the specified rectangle.
  GooString *getText(double xMin, double yMin,
       double xMax, double yMax);

  // Find a string by character position and length.  If found, sets
  // the text bounding rectangle and returns true; otherwise returns
  // false.
  bool findCharRange(int pos, int length,
          double *xMin, double *yMin,
          double *xMax, double *yMax);

  void drawSelection(OutputDev *out, double scale, int rotation,
         PDFRectangle *selection,
         SelectionStyle style,
         GfxColor *glyph_color, GfxColor *box_color);

  std::vector<PDFRectangle*> *getSelectionRegion(PDFRectangle *selection,
            SelectionStyle style,
            double scale);

  GooString *getSelectionEText(PDFRectangle *selection,
            SelectionStyle style);

  // If true, will combine characters when a base and combining
  // character are drawn on eachother.
  void setMergeCombining(bool merge);

#ifdef TEXTOUT_WORD_LIST
  // Build a flat word list, in content stream order (if
  // this->rawOrder is true), physical layout order (if
  // this->physLayout is true and this->rawOrder is false), or reading
  // order (if both flags are false).
  ETextWordList *makeWordList();
#endif

  // Returns the ETextPage object for the last rasterized page,
  // transferring ownership to the caller.
  ETextPage *takeEText();

  // Turn extra processing for HTML conversion on or off.
  void enableHTMLExtras(bool doHTMLA) { doHTML = doHTMLA; }

  // Get the head of the linked list of ETextFlows for the
  // last rasterized page.
  ETextFlow *getFlows();

    static constexpr EndOfLineKind defaultEndOfLine()
    {
#if defined(_WIN32)
        return eolDOS;
#else
        return eolUnix;
#endif
    }
    void setTextEOL(EndOfLineKind textEOLA) { textEOL = textEOLA; }
    void setTextPageBreaks(bool textPageBreaksA) { textPageBreaks = textPageBreaksA; }

private:

  ETextPage *text;    // text for the current page
  bool physLayout;    // maintain original physical layout when
        //   dumping text
  double fixedPitch;    // if physLayout is true and this is non-zero,
        //   assume fixed-pitch characters with this
        //   width
  bool rawOrder;    // keep text in content stream order
  bool discardDiag;     // Diagonal text, i.e., text that is not close to one of the
        //0, 90, 180, or 270 degree axes, is discarded. This is useful
        // to skip watermarks drawn on top of body text, etc.
  bool doHTML;      // extra processing for HTML conversion
  bool ok;      // set up ok?

    bool textPageBreaks; // insert end-of-page markers?
  EndOfLineKind textEOL; // type of EOL marker to use
  ActualEText *actualEText;
};

#endif
