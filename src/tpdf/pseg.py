import numpy
import skimage
import sklearn.cluster


# page segmentation


def kmean_binarize(n_clusters, image):
    image_rs = image.reshape((image.shape[0] * image.shape[1], 1))
    km = sklearn.cluster.KMeans(n_clusters=n_clusters, random_state=0).fit(image_rs)

    largest_label = 0
    largest_label_count = 0
    for i in range(0, 3):
        label_count = numpy.count_nonzero(km.labels_ == i)
        if label_count > largest_label_count:
            largest_label_count = label_count
            largest_label = i

    threshold_color = image_rs[km.labels_ == largest_label][0][0]
    if threshold_color >= 127:
        threshold_color -= 1
    else:
        threshold_color += 1

    image[image >= threshold_color] = 255
    image[image < threshold_color] = 0
    return image


def prepare_images_for_segmentation(source_image):
    """
    `prepare_images_for_segmentation` prepares binarized images for
    segmentation from an original RGB input image.

    parameters:
    source_image: A numpy array of shape (nrows, ncols, nchannels),
                  typically returned from skimage.io.imread .

    returns:
    (target_scale, im_bin_clear, im_bin_blurred)
    target_scale:   The scale of the resulting image size to the original
                    one: original_size / target_scale = result_size
    im_bin_clear:   Binarized result image (clear version),
                    format: numpy.array(nrows, ncols), 1-channel ubyte (0-255)
    im_bin_blurred: Binarized result image (blurred version),
                    format: numpy.array(nrows, ncols), 1-channel ubyte (0-255)

    """
    # Target narrow side in pixels for segmentation processing, height for
    # a landscape document, width for a portrait one
    TARGET_NARROW_SIDE = 400
    # Gaussian blur sigma for the "blurred_bin" version, used primarily
    # to isolate paragraphs. For it to work properly, the characters in a
    # paragraph must be touched together to form a connected shape, but not
    # connected to the next paragraph. Higher value means more blur (more
    # likely to connect to other paragraphs)
    BLUR_SIGMA = 1.3
    # Gaussian blur sigma for the "clear_bin" version, used primarily to
    # isolate table cell texts. For it to work properly, a slight bit of
    # blur is still needed so that the characters inside one cell are
    # stiched together, but not to the adjacent cells.
    BLUR_SIGMA_CLEAR = 1

    # size down the image
    image = skimage.color.rgb2gray(source_image)
    height = image.shape[0]
    width = image.shape[1]
    target_scale = 1
    if (width > height):
        target_scale = height / TARGET_NARROW_SIDE
    else:
        target_scale = width / TARGET_NARROW_SIDE

    twidth = int(width / target_scale)
    theight = int(height / target_scale)
    thumb_image = skimage.transform.resize_local_mean(image, (theight, twidth))
    thumb_image[thumb_image > 1] = 1

    # before even doing anything else, turn 5% from the top of the page
    # to white to avoid any weird navigation bars or headers like the us
    # steel report situation
    thumb_image[0:int(400 * 0.05), :] = 1

    # im_bin = kmean_binarize(3, skimage.util.img_as_ubyte(thumb_image))
    # skimage.io.imsave(filename.replace('test', 'bin'), skimage.util.img_as_ubyte(im_bin))
    # hd_threshold = skimage.filters.threshold_otsu(thumb_image)
    clear_threshold = skimage.filters.threshold_otsu(skimage.filters.gaussian(thumb_image, sigma=(BLUR_SIGMA_CLEAR, BLUR_SIGMA_CLEAR)))
    im_bin_clear = skimage.util.img_as_ubyte(thumb_image >= clear_threshold)

    blurred = skimage.filters.gaussian(thumb_image, sigma=(BLUR_SIGMA, BLUR_SIGMA))
    blurred[blurred > 1] = 1
    blurred = skimage.util.img_as_ubyte(blurred)
    # skimage.io.imsave(filename.replace('test', 'blurred'), blurred)

    im_bin_blurred = kmean_binarize(3, blurred)
    return (target_scale, im_bin_clear, im_bin_blurred)


def columns_from_image(im_bin_clear):
    """
    `columns_from_image` detect and extract column positions from a clear
    binarized image. The detection is based on large span of horizontal
    blank space (white, 255), and is implemented via
    `skimage.transform.probabilistic_hough_line` for vertical lines that
    is at least 0.95 of the image height long.

    parameters:
    im_bin_clear:   Binarized result image (clear version),
                    format: numpy.array(nrows, ncols), 1-channel ubyte (0-255)

    returns:
    (columns, spacings)
    columns:    A list of detected columns containing some content.
                Each column is `[left, right]`, where `left` and `right`
                are the respective column pixel indices in the image.
                `right` is inside the column.
    spacings:   A list of detected spacings that are all white.
                Each spacing is `[left, right]`, where `left` and `right`
                are the respective column pixel indices in the image.
                `right` is inside the spacing.

    """
    MIN_COLUMN_SPACING = 15

    width = im_bin_clear.shape[1]
    height = im_bin_clear.shape[0]
    # probabilistic hough line detection, vertical lines (empty spaces)
    # at least 0.95 of total height
    lines = skimage.transform.probabilistic_hough_line(im_bin_clear, line_length=int(im_bin_clear.shape[0] * 0.95), line_gap=0, theta=numpy.array([0.]))
    # sort lines from left to right
    lines = sorted(lines, key=lambda lines:lines[0][0])

    columns = []
    spacings = []
    spacing = [0, 0]
    for line_idx, ((x0, y0), (x1, y1)) in enumerate(lines):
        if x0 - spacing[1] <= 1:
            # line is adjacent, expand spacing
            spacing[1] = x0
            if line_idx != len(lines) - 1:
                continue
        # line is not adjacent, build column, reset spacing
        column = [spacing[1], x0]
        if column[0] != column[1]:
            columns.append(column)
        if spacing[0] != spacing[1]:
            spacings.append(spacing)
        spacing = [x0, x0]

    # merge columns with very narrow spacing
    while True:
        col_count = len(columns)
        col_changed = False
        for i in range(1, col_count):
            if (columns[i][0] - columns[i - 1][1]) < MIN_COLUMN_SPACING:
                # rr, cc = skimage.draw.rectangle((0, columns[i - 1][1]), (cd_image.shape[0] - 1, columns[i][0]))
                # skimage.draw.set_color(cd_image, (rr, cc), color_cycle.get_vvrgb(10), 1)
                columns[i - 1] = [columns[i - 1][0], columns[i][1]]
                del columns[i]
                col_changed = True
                break
        if not col_changed:
            break
    # eliminate narrow spacings
    spacings = [[spl, spr] for (spl, spr) in spacings if (spr - spl) >= MIN_COLUMN_SPACING]
    return (columns, spacings)


def clear_column_spacing(spacings, im_bin_clear, im_bin_blurred):
    """
    `clear_column_spacing` is a utility function to improve segmentation
    quality by clearing out known (from column detection) empty spacings
    from the image, so that blurring will not bleed past the edges of
    the columns.

    """
    # clear `blurred` and `im_bin_blurred` to avoid blurring bleeding edges to
    # interfere with column based processing
    for [spacing_left, spacing_right] in spacings:
        im_bin_blurred[:, spacing_left:spacing_right] = 255
        im_bin_clear[:, spacing_left:spacing_right] = 255


def row_groups_from_columns(columns, im_bin_clear):
    """
    `row_groups_from_columns` searches a column line by line (in pixels),
    for empty spacings between rows of contents. It also groups those
    rows based on vertical spacings. Spacings within `MAX_ROW_VSPACING`
    belong to the same "row group".

    parameters:
    columns:        Parsed columns returned from `columns_from_image`
    im_bin_clear:   Binarized result image (clear version),
                    format: numpy.array(nrows, ncols), 1-channel ubyte (0-255)

    returns:
    (column_row_groups, column_row_vspacings)
    column_row_groups:  A dict where the key is `column_index`, and the
                        value is `row_groups`. `row_groups` is a list of list
                        where the first dimension is the `group`, and the
                        second dimension is the `rows`. Each `row` is a
                        2-element list where 0 is row begin, 1 is row end,
                        both in pixels from the top of the column (0).
    column_row_vspacings:   A dict where the key is `column_index` and the
                            value is `row_vspacings`, which is a numpy
                            array in the length of column pixel height,
                            with array content 0=text, 1=spacing.

    """
    MAX_ROW_VSPACING = 25
    column_row_groups = {}
    column_row_vspacings = {}
    for col_idx, column in enumerate(columns):
        col_crop = im_bin_clear[0:im_bin_clear.shape[0], column[0]:column[1]]
        col_sum = col_crop.shape[1] * 255
        # vertical spacings between rows, in pixels: 0=text, 1=spacing
        row_vspacings = numpy.zeros(col_crop.shape[0], dtype=numpy.uint8)
        for i in range(0, col_crop.shape[0]):
            if numpy.sum(col_crop[i, :]) == col_sum:
                row_vspacings[i] = 1
        column_row_vspacings[col_idx] = row_vspacings
        # group rows that have tight spacing, a bet to separate multiple tables
        # in the same column
        row_groups = []
        rows = []
        cur_row = []    # 2-element list: [0:row begin, 1:row end]
        last_row_end = 0
        for i in range(0, col_crop.shape[0]):
            # encounter a row marker
            if row_vspacings[i] == 1:
                if len(cur_row) == 2:
                    last_row_end = i
                    rows.append(cur_row)
                cur_row = []
            # encounter a text row of pixels
            elif i > 0:
                if len(cur_row) == 0:
                    # begin of a new row
                    if (i - last_row_end >= MAX_ROW_VSPACING and
                        rows):
                        row_groups.append(rows)
                        rows = []
                    cur_row.append(i)
                elif len(cur_row) == 1:
                    cur_row.append(i)
                elif len(cur_row) == 2:
                    cur_row[1] = i
        if rows:
            row_groups.append(rows)
        column_row_groups[col_idx] = row_groups
    return column_row_groups, column_row_vspacings


def row_hspacings_from_row_groups(columns, column_row_groups, im_bin_clear):
    """
    `row_hspacings_from_row_groups` searches a "row" (content row, as returned
    from `row_groups_from_columns`, containing multiple pixel rows) for
    spacings, much like the column detection routine `columns_from_image`.
    "Spacing" is defined as a blank space for the entire column pixel inside
    the content row. The purpose is to find table cell spacings while account
    for inter-character and inter-word spacings. `MIN_SPACING_SPAN` is the
    smallest allowed amount of spacing in pixels. Anything below this number
    is considered a part of content.

    parameters:
    columns:            Parsed columns returned from `columns_from_image`
    column_row_groups:  Parsed row_groups returned from
                        `row_groups_from_columns`
    im_bin_clear:   Binarized result image (clear version),
                    format: numpy.array(nrows, ncols), 1-channel ubyte (0-255)

    returns:
    column_row_grp_row_spacings
    column_row_grp_row_spacings:    A dict of dict, where the first-level key
                    is `column index`, and the second-level key is `row group
                    index`, like `row_groups_from_columns`. At the second-
                    level dict, the values are `row_hspacings`, which is a
                    list of `row_hspacing` corresponding to each `row` for
                    each `row group`. `row_hspacing` is a numpy array in the
                    length of row pixel width, with array content 0=text,
                    1=spacing.
    """
    MIN_SPACING_SPAN = 5
    column_row_grp_row_spacings = {}
    for col_idx, column in enumerate(columns):
        col_crop = im_bin_clear[0:im_bin_clear.shape[0], column[0]:column[1]]
        column_row_grp_row_spacings[col_idx] = {}
        for row_grp_idx, rows in enumerate(column_row_groups[col_idx]):
            # find horizontal spacing (between characters, words, or table cells)
            # in each row
            row_hspacings = []  # all spacings for all rows within this column
                                # can be used to identify tabular structure through
                                # overlapping
            for row in rows:
                row_crop = col_crop[row[0]:row[1], :]
                row_sum = row_crop.shape[0] * 255
                # 0=text, 1=spacing
                row_spacing = numpy.zeros(row_crop.shape[1], dtype=numpy.uint8)
                for i in range(0, row_crop.shape[1]):
                    if numpy.sum(row_crop[:, i]) == row_sum:    # all white
                        row_spacing[i] = 1
                # eliminate narrow spacing
                for spacing_span in range(1, MIN_SPACING_SPAN):
                    for i in range(spacing_span, row_crop.shape[1] - spacing_span):
                        if (numpy.sum(row_spacing[i - spacing_span:i + spacing_span + 1]) <= spacing_span and
                            row_spacing[i - spacing_span] == 0 and
                            row_spacing[i + spacing_span] == 0):
                            row_spacing[i - spacing_span:i + spacing_span + 1] = 0
                row_hspacings.append(row_spacing)
            # `row_hspacings` 1=spacing, 0=content
            if row_hspacings:
                row_hspacings = numpy.array(row_hspacings)
                column_row_grp_row_spacings[col_idx][row_grp_idx] = row_hspacings
    return column_row_grp_row_spacings


def vertical_lines_from_hspacings(row_hspacings):
    """
    `vertical_lines_from_hspacings` finds "vertical lines", that is, a line
    that cross through a group of rows from top to bottom, in spacing, to
    later form a line in a table.

    parameters:
    row_hspacings:  The value of the second-level dict returned from
                    `row_hspacings_from_row_groups`

    returns:
    lines:  A list of lines, each is a tuple of tuple ((x0, y0), (x1, y1)),
            compatible with skimage. Zero is the beginning of the row
            group, and column respectively.

    """
    lines = []
    # `row_hspacings` 2d numpy array, 1st dimension a group of rows, 2nd
    # dimension is `row_hspacing`: 1=spacing, 0=content
    for x in range(0, row_hspacings.shape[1]):
        y_top = None
        y_bottom = None
        y_cur = 0
        while True:
            if (y_cur >= row_hspacings.shape[0]):
                break
            if row_hspacings[y_cur, x] == 0:     # saw content, continue search
                if (y_bottom is not None and    # add previous segment if established
                    y_top is not None and
                    y_bottom - y_top >= 1):
                    lines.append(((x, y_top), (x, y_bottom)))
                y_top = None
                y_bottom = None
            else:                               # saw spacing
                if y_top is None:
                    y_top = y_cur
                y_bottom = y_cur
            y_cur += 1
        if (y_bottom is not None and
            y_top is not None and
            y_bottom - y_top >= 1):
            lines.append(((x, y_top), (x, y_bottom)))
    # sort lines by height, tall to short, prepare to optimize towards line clusters
    if lines:
        lines = sorted(lines, key=lambda lines:(lines[0][1] - lines[1][1]) * lines[0][1])
    return lines


class tablevspan:
    """
    `tablevspan` is a namespace container for all the table column detection
    routines. Column detection is based on the `lines` from
    `vertical_lines_from_hspacings`, where a vertical line that crosses
    through an entire group of rows is very likely to be a line from a
    table. The procedure starts from converting a group of adjacent lines
    to rectangles, and then filter those rectangles to form final results.

    """
    @staticmethod
    def group_adjacent_lines(lines):
        # group adjacent lines in the same height, into rectangles
        rects = []
        if not lines:
            return rects
        rect = lines[0]
        for i in range(1, len(lines)):
            line = lines[i]
            # same height, adjacent
            if (line[1][1] == rect[1][1] and
                line[0][1] == rect[0][1] and
                (rect[0][0] - line[0][0] == 1 or
                line[0][0] - rect[1][0]) == 1):
                # expand rect
                rect = ((min(line[0][0], rect[0][0]), rect[0][1]), (max(line[0][0], rect[1][0]), rect[1][1]))
            else:
                rects.append(rect)
                rect = line
        rects.append(rect)
        return rects

    @staticmethod
    def remove_smaller_adjacent_rectangles(rects):
        # build a lookup table of adjacent, smaller rectangles
        adjacent_rects = {}
        for rect in rects:
            # key is the pivot rect
            key = rect
            touched_rects = []
            for rect in rects:
                if rect == key:
                    continue
                if ((key[1][0] + 1 == rect[0][0] or     # `key` rightside touching `rect` leftside
                    key[0][0] == rect[1][0] + 1) and    # `key` leftside touching `rect` rightside
                    # vertically intersect (touched)
                    min(key[1][1], rect[1][1]) - max(key[0][1], rect[0][1]) > 0 and
                    # smaller or equal
                    rect[1][1] - rect[0][1] <= key[1][1] - key[0][1]):
                    touched_rects.append(rect)
            adjacent_rects[key] = touched_rects
        # remove all adjacent smaller rectangles, keeping only the largest one
        for key, touched_rects in adjacent_rects.items():
            for rect in touched_rects:
                try:
                    rects.remove(rect)
                except ValueError:
                    # ok if not found (already removed)
                    pass
        return rects

    @staticmethod
    def remove_edge_rectangles(rects, row_hspacings):
        # filter rects having empty left or right side
        filtered_rects = []
        for rect in rects:
            if (rect[0][0] == 0 or
                rect[1][0] == row_hspacings.shape[1] - 1):
                # skip grouped lines touching left / right of the column,
                # as they provide no useful information
                filtered_rects.append(rect)
            # in already grouped lines, remove rectangles that are only 1 pixel wide
            if rect[1][0] - rect[0][0] <= 1:
                filtered_rects.append(rect)
        for rect in filtered_rects:
            try:
                rects.remove(rect)
            except ValueError:
                # ok if not found (already removed)
                pass
        # resort rects from left to right, prepare to clear rects having empty
        # left or right side
        rects = sorted(rects, key=lambda rects:rects[0][0])
        filtered_rects = []
        for ((x0, y0), (x1, y1)) in rects:
            left_side = row_hspacings[y0:(y1 + 1), 0:(x0 + 1)]
            right_side = row_hspacings[y0:(y1 + 1), x1:(row_hspacings.shape[1] + 1)]
            if numpy.all(left_side == 1):
                filtered_rects.append(((x0, y0), (x1, y1)))
            if numpy.all(right_side == 1):
                filtered_rects.append(((x0, y0), (x1, y1)))
        for rect in filtered_rects:
            rects.remove(rect)
        return rects

