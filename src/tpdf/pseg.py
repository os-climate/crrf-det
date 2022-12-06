"""
'pseg' or 'page segmentation' module holds routines to parse and identify
floating text boxes, paragraphs, and tables from an input image of a PDF
image.

"""


import numpy
import skimage
# import scipy.spatial
import sklearn.cluster

from . import helper


def parse(input_image):
    (target_scale, im_bin_clear, im_bin_blurred) = prepare_images_for_segmentation(input_image)
    # page-level column detection
    (columns, spacings) = columns_from_image(im_bin_clear)
    # clear `blurred` and `im_bin_blurred` to avoid blurring bleeding edges to
    # interfere with column based processing
    clear_column_spacing(spacings, im_bin_clear, im_bin_blurred)
    # for each column, detect inter-paragraph, inter-table vertical spacing
    # between rows
    column_row_groups, column_row_vspacings = row_groups_from_columns(columns, im_bin_clear)
    column_row_grp_row_spacings = row_hspacings_from_row_groups(columns, column_row_groups, im_bin_clear)

    column_row_grp_vlines = {}
    column_row_grp_tablevspan = {
        '01_group_adjacent_lines':                  {},
        '02_remove_smaller_adjacent_rectangles':    {},
        '03_remove_edge_rectangles':                {},
        '04_is_first_rectangle_column_valid':      {},
        '05_remove_busy_column_rectangles':         {},
    }
    column_row_grp_build_table = {}
    column_row_grp_cells = {}

    for col_idx in sorted(column_row_grp_row_spacings):
        column = columns[col_idx]
        col_crop = im_bin_clear[0:im_bin_clear.shape[0], column[0]:column[1]]
        column_row_grp_vlines[col_idx] = {}
        column_row_grp_tablevspan['01_group_adjacent_lines'][col_idx] = {}
        column_row_grp_tablevspan['02_remove_smaller_adjacent_rectangles'][col_idx] = {}
        column_row_grp_tablevspan['03_remove_edge_rectangles'][col_idx] = {}
        column_row_grp_tablevspan['04_is_first_rectangle_column_valid'][col_idx] = {}
        column_row_grp_tablevspan['05_remove_busy_column_rectangles'][col_idx] = {}
        column_row_grp_build_table[col_idx] = {}
        column_row_grp_cells[col_idx] = {}
        for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
            rows = column_row_groups[col_idx][row_grp_idx]
            row_hspacings = column_row_grp_row_spacings[col_idx][row_grp_idx]

            # find vertical cross-throughs (vertical table lines)
            lines = vertical_lines_from_hspacings(row_hspacings)
            if not lines:
                continue
            column_row_grp_vlines[col_idx][row_grp_idx] = lines

            # group adjacent lines in the same height, into rectangles
            rects = tablevspan.group_adjacent_lines(lines)
            column_row_grp_tablevspan['01_group_adjacent_lines'][col_idx][row_grp_idx] = rects.copy()
            # build a lookup table of adjacent, smaller rectangles
            # remove all adjacent smaller rectangles, keeping only the largest one
            rects = tablevspan.remove_smaller_adjacent_rectangles(rects)
            column_row_grp_tablevspan['02_remove_smaller_adjacent_rectangles'][col_idx][row_grp_idx] = rects.copy()
            rects = tablevspan.remove_edge_rectangles(rects, row_hspacings)
            column_row_grp_tablevspan['03_remove_edge_rectangles'][col_idx][row_grp_idx] = rects.copy()
            # heuristics: to count as a table, the first column must be filled
            # to 75%, otherwise disregard everything.
            while True:
                if not rects:
                    break
                if not tablevspan.is_first_rectangle_column_valid(rects, row_hspacings):
                    rects = rects[1:]
                    continue
                break
            column_row_grp_tablevspan['04_is_first_rectangle_column_valid'][col_idx][row_grp_idx] = rects.copy()

            # find "busyness" of rect neighboring columns, if too busy, the
            # rect is likely a misinterpretation because table texts are likely
            # to be scattered.
            rects = tablevspan.remove_busy_column_rectangles(rects, row_hspacings)
            column_row_grp_tablevspan['05_remove_busy_column_rectangles'][col_idx][row_grp_idx] = rects.copy()

            (table_scope, table_rows, table_cols) = tablevspan.build_table(column, rows, row_hspacings, rects, im_bin_blurred)
            column_row_grp_build_table[col_idx][row_grp_idx] = (table_scope, table_rows, table_cols)

            # cells
            (intersections, intersections_upward, intersections_downward) = tablevspan.find_intersections(column, rows, table_cols, table_rows)
            cells = tablevspan.find_cells(intersections, intersections_upward, intersections_downward)
            column_row_grp_cells[col_idx][row_grp_idx] = (intersections, intersections_upward, intersections_downward, cells)

    text_boxes = text_boxes_from_image(im_bin_clear, im_bin_blurred)

    return {
        'target_scale':         target_scale,
        'text_boxes':           text_boxes,
        'im_bin_clear':         im_bin_clear,
        'columns':              columns,
        'spacings':             spacings,
        'column_row_groups':    column_row_groups,
        'column_row_vspacings': column_row_vspacings,
        'column_row_grp_vlines':        column_row_grp_vlines,
        'column_row_grp_row_spacings':  column_row_grp_row_spacings,
        'column_row_grp_tablevspan':    column_row_grp_tablevspan,
        'column_row_grp_build_table':   column_row_grp_build_table,
        'column_row_grp_cells':         column_row_grp_cells,
    }


def kmean_binarize(n_clusters, image):
    """
    `kmean_binarize` is used by `prepare_images_for_segmentation` to binarize
    primarily blurred images for contour finding, among other tasks. The
    implementation uses `sklearn.cluster.KMeans` to find the "dominant color"
    of a grayscale image, then add/subtract slightly to make sure the "dominant
    color" is on one side and everything else is on another side of a binary
    image. It will work on both white-text-on-black-background, and black-text-
    on-white-background scenarios. A typical value for `n_clusters` would be 3,
    since it will account for the transition pixels going from text to
    background, keeping legibility of the text.

    """
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


def calc_target_scale(width, height):
    # Target narrow side in pixels for segmentation processing, height for
    # a landscape document, width for a portrait one
    TARGET_NARROW_SIDE = 400
    target_scale = 1
    if (width > height):
        target_scale = height / TARGET_NARROW_SIDE
    else:
        target_scale = width / TARGET_NARROW_SIDE
    return target_scale


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

    target_scale = calc_target_scale(width, height)

    twidth = int(width / target_scale)
    theight = int(height / target_scale)
    thumb_image = skimage.transform.resize_local_mean(image, (theight, twidth))
    thumb_image[thumb_image > 1] = 1

    # before even doing anything else, turn 5% from the top of the page
    # to white to avoid any weird navigation bars or headers like the us
    # steel report situation
    thumb_image[0:int(min(twidth, theight) * 0.045), :] = 1

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

    if len(columns) > 3:
        # Four or more columns might be too many for a page. We are likely
        # in a situation where there are tables on the page, and some of
        # the column spacings are too wide.
        #
        # Heuristic #1, determine whether it is actually a two-column
        # layout by finding a spacing that covers the middle.
        middle_idx = -1
        # Two trials to find the middle spacing, first try full page
        # middle (width / 2). If fails, run on max spacing middle
        # (spacings[-1][1] / 2) to account for side binding shift.
        for middle in [width / 2, spacings[-1][1] / 2]:
            for spc_idx, spacing in enumerate(spacings):
                if (spacing[1] >= middle and
                    spacing[0] <= middle):
                    middle_idx = spc_idx
                    break
            if middle_idx != -1:
                break
        if middle_idx != -1:
            # So we have a middle spacing, this could be a two column
            # layout. This could be determined by spacing length.
            # For more columns to live inside the two column layout,
            # these columns must be narrower.
            mid_spc_width = spacings[middle_idx][1] - spacings[middle_idx][0]
            # Loop through all spacings except for the first and last
            rogue_spacings = []
            for i in range(1, len(spacings) - 1):
                if i == middle_idx:
                    continue
                spacing = spacings[i]
                if spacing[1] - spacing[0] > mid_spc_width:
                    rogue_spacings.append(spacing)
            if rogue_spacings:
                new_columns = []
                removed_columns = []
                for spacing in rogue_spacings:
                    new_column = [-1, -1]
                    for column in columns:
                        if column[1] == spacing[0]:
                            new_column[0] = column[0]
                            removed_columns.append(column)
                        elif column[0] == spacing[1]:
                            new_column[1] = column[1]
                            removed_columns.append(column)
                        if (new_column[0] != -1 and
                            new_column[1] != -1):
                            break
                    new_columns.append(new_column)
                    spacings.remove(spacing)
                for column in removed_columns:
                    columns.remove(column)
                columns += new_columns
                columns = sorted(columns, key=lambda columns:columns[0])
        else:
            # Heuristic #2, it is not a two column layout. But it is risky
            # to proceed with so many columns. It is still very likely a
            # big table with plenty of white spacings, consider it a
            # single column.
            if len(spacings) >= 2:
                spacing_left = spacings[0]
                spacing_right = spacings[-1]
                columns = [[spacing_left[1], spacing_right[0]]]
                spacings = [spacing_left, spacing_right]
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
                row_sum_all_white = row_crop.shape[0] * 255
                # 0=text, 1=spacing
                row_spacing = numpy.zeros(row_crop.shape[1], dtype=numpy.uint8)
                # calculate the column pixel sum values to identify columns of
                # complete white, and later turn those columns in `row_spacing`
                # to 1.
                row_sums = numpy.sum(row_crop, axis=0)
                row_spacing[row_sums == row_sum_all_white] = 1
                # eliminate narrow spacing (vectorized version, see original
                # implementation below in comment)
                row_spacing_diff = numpy.insert(numpy.diff(row_spacing), 0, 0)
                text_to_white = numpy.where(row_spacing_diff == 1)[0]
                white_to_text = numpy.where(row_spacing_diff == 255)[0]
                for span_idx, span in enumerate(white_to_text[1:] - text_to_white[:len(white_to_text) - 1]):
                    if span < MIN_SPACING_SPAN:
                        row_spacing[text_to_white[span_idx]:text_to_white[span_idx] + span] = 0
                # eliminate narrow spacing (original version)
                # for spacing_span in range(1, MIN_SPACING_SPAN):
                #     for i in range(spacing_span, row_crop.shape[1] - spacing_span):
                #         if (numpy.sum(row_spacing[i - spacing_span:i + spacing_span + 1]) <= spacing_span and
                #             row_spacing[i - spacing_span] == 0 and
                #             row_spacing[i + spacing_span] == 0):
                #             row_spacing[i - spacing_span:i + spacing_span + 1] = 0
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


def text_boxes_from_image(im_bin_clear, im_bin_blurred):
    # text_vertices = []
    text_boxes = []
    contours = skimage.measure.find_contours(im_bin_blurred)
    for contour in contours:
        xmin = numpy.amin(contour[:, 1])
        xmax = numpy.amax(contour[:, 1])
        ymin = numpy.amin(contour[:, 0])
        ymax = numpy.amax(contour[:, 0])
        # optimization: filter absolutely too small contours
        if (ymax - ymin <= 3 and
            xmax - xmin <= 3):
            continue
        # optimization: still small, but draw a polygon to find out whether
        # the area is completely white
        if xmax - xmin < 50:
            # test the contour against the "bin_clear" image, if the covered
            # region is all white, we can safely ignore it
            rr, cc = skimage.draw.polygon(contour[:, 0], contour[:, 1])
            if numpy.all(im_bin_clear[rr, cc] == 255):
                continue
        text_boxes.append((ymin, xmin, ymax, xmax))
        # debug purpose polygons
        # hull = scipy.spatial.ConvexHull(contour)
        # vertices = contour[hull.vertices,:]
        # vertices *= target_scale
        # text_vertices.append(vertices)
    return text_boxes


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

    @staticmethod
    def is_first_rectangle_column_valid(rects, row_hspacings):
        # heuristics 1: to count as a table, the first column must be filled
        # to 60%, otherwise disregard everything.
        if not rects:
            return False
        filled_count = 0
        ((x0, y0), (x1, y1)) = rects[0]
        height = 0.6 * (y1 - y0 + 1)
        white_sum = x0
        for i in range(y0, y1 + 1):
            is_filled = numpy.sum(row_hspacings[i, 0:x0]) < white_sum
            if is_filled:
                filled_count += 1
        # account for noise, consider the possibility of the second
        # column as "the first"
        filled_count2 = 0
        height2 = height
        if len(rects) > 1:
            ((x0, y0), (x1, y1)) = rects[1]
            height2 = 0.6 * (y1 - y0 + 1)
            white_sum = x0
            for i in range(y0, y1 + 1):
                is_filled = numpy.sum(row_hspacings[i, 0:x0]) < white_sum
                if is_filled:
                    filled_count2 += 1
        if (filled_count < height and
            filled_count2 < height2):
            return False
        # heuristics 2: first column should relatively be tall, and it
        # should not be the shortest column of the entire table, also
        # it should end in the same row as some other columns
        if len(rects) > 1:
            ((x0, y0), (x1, y1)) = rects[0]
            col_heights = [y1 - y0 for ((x0, y0), (x1, y1)) in rects[1:]]
            col_height_thrs = numpy.median(col_heights)
            all_rect_bottoms = set([y1 for ((x0, y0), (x1, y1)) in rects[1:]])
            if (y1 - y0 < col_height_thrs and
                (y1 not in all_rect_bottoms or
                # often times, the bottom row is "total", which can extend
                # into contents below table, forming an unnecessary column.
                # the following statement requires the first column to be
                # at least 3 rows tall
                y1 - y0 < 3)):
                return False
        return True

    @staticmethod
    def remove_busy_column_rectangles(rects, row_hspacings):
        # find "busyness" of rect neighboring columns, if too busy, the
        # rect is likely a misinterpretation because table texts are likely
        # to be scattered.
        filtered_rects = []
        for ((x0, y0), (x1, y1)) in rects:
            # 0=text, 1=white, for `text_value` and `row_total` below, a
            # high value indicates white, and a low value indicates text,
            # calculated on a row-total basis.
            text_value = numpy.sum(row_hspacings[y0:(y1 + 1), :])
            row_total = row_hspacings.shape[1] * (y1 - y0)
            # a very low `text_value`, defined as "< 0.1 * row_total"
            # indicates that the row looks awful lot like just text, since
            # table cells should have plenty of spacing
            if text_value < 0.15 * row_total:
                filtered_rects.append(((x0, y0), (x1, y1)))
            # todo: once a busy column is discovered, not only the table
            # column dividing rectangle should be removed, for the entire
            # row group, any other rectangles touching the same row should
            # be broken apart
        for rect in filtered_rects:
            rects.remove(rect)
        return rects

    @staticmethod
    def build_table(column, rows, row_hspacings, rects, im_bin_blurred):
        """
        `build_table` generates coordinates for rows and columns that could
        be used to build a table from "row vertical spacing" covering
        rectangles from previous steps.

        It also clears the rows and columns from the `im_bin_blurred`
        image so that later contour finding operations can skip clear edges
        of tables and stick to the cell text.

        """
        # the left most rect's left side is the first column, use its content
        # to identify potentially multiple tables
        table_scope = []
        if rects:
            # mechanism for recording the right side (or end) of the first
            # text column
            per_row_col1_ends = {}
            for ((x0, y0), (x1, y1)) in rects:
                per_row_col1_ends[y0] = min(x0, per_row_col1_ends.get(y0, 100000))
            # loop through all the "first columns"
            rect_left = numpy.array([x0 for ((x0, y0), (x1, y1)) in rects], dtype=numpy.uint)
            for rect_row, col1_end in sorted(per_row_col1_ends.items()):
                # locate this first column rect, and determine its
                # top/bottom rows
                col1_idx = numpy.where(rect_left == col1_end)[0][0]
                col1_top_row_idx = rects[col1_idx][0][1]
                col1_bottom_row_idx = rects[col1_idx][1][1]
                # loop through all the rows primarily to check whether
                # the first column has content, because generally
                # speaking, the first column should be filled with text,
                # or this could be mis-detection
                cur_table_start = None
                for row_idx in range(col1_top_row_idx, col1_bottom_row_idx + 1):
                    # determine the column at least has one pixel black (0)
                    has_content = numpy.sum(row_hspacings[row_idx, 0:col1_end]) < col1_end
                    # this row is text
                    if has_content:
                        # `cur_table_start=None` means the last row is blank space
                        if cur_table_start is None:
                            # except for the top row, all the rest tables can have
                            # a single row of empty cells, for either a first
                            # column header, or caption
                            if row_idx > col1_top_row_idx:
                                # reduce last "table height"
                                if table_scope:
                                    table_scope[-1][1] -= 1
                                # mark table start as the last row (blank space)
                                cur_table_start = row_idx - 1
                            else:
                                cur_table_start = row_idx
                        continue
                    # this row is blank space
                    else:
                        # continue expand the previous table if applicable,
                        # tables are allowed to have blank space rows in
                        # the bottom
                        if (table_scope and
                            table_scope[-1][1] == row_idx - 1):
                            table_scope[-1][1] = row_idx
                        # no tables found yet, create the first one
                        elif cur_table_start is not None:
                            if (not table_scope or
                                cur_table_start >= table_scope[-1][1]):
                                table_scope.append([cur_table_start, row_idx])
                            cur_table_start = None
                if cur_table_start is not None:
                    if (not table_scope or
                        cur_table_start >= table_scope[-1][1]):
                        table_scope.append([cur_table_start, row_idx])
        #

        # enumerate all rects for covered row spacings, use them to clear out
        # the blurred version so that table cell texts are no longer sticked
        # together
        table_rows = set()
        for ((x0, y0), (x1, y1)) in rects:
            for i in range(y0, y1):
                row_x = (rows[i][1] + rows[i + 1][0]) / 2
                row = (row_x, column[0], row_x, column[1])
                table_rows.add(row)
                # clear out the lines to split blurred parts for table cell text
                rr, cc = skimage.draw.line(*[int(x) for x in row])
                im_bin_blurred[rr, cc] = 255

        # additional logic: the above mechanism cannot detect multiple tables
        # inside the same column delimited by a segment of footnotes, like
        # John Deere 2021, page 64
        # to address this, add additional rows when there are multiple
        # rectangles touching the same top or bottom, but not row group
        # boundaries
        rect_tops = {}
        rect_bottoms = {}
        for ((x0, y0), (x1, y1)) in rects:
            if (y0 == 0 or
                y1 >= rows[-1][1]):
                continue
            rect_tops[y0] = rect_tops.get(y0, 0) + 1
            rect_bottoms[y1] = rect_bottoms.get(y1, 0) + 1
        for i, count in rect_tops.items():
            if count >= 2:
                row_x = (rows[i][0] + rows[i - 1][1]) / 2
                table_rows.add((row_x, column[0], row_x, column[1]))
        for i, count in rect_bottoms.items():
            if (count >= 2 and
                i < len(rows) - 1):
                row_x = (rows[i][1] + rows[i + 1][0]) / 2
                table_rows.add((row_x, column[0], row_x, column[1]))

        table_cols = set()
        for ((x0, y0), (x1, y1)) in rects:
            if y0 > 0:
                col_y_start = (rows[y0][0] + rows[y0 - 1][1]) / 2
            else:
                col_y_start = rows[y0][0]
            if y1 < len(rows) - 1:
                col_y_end = (rows[y1][1] + rows[y1 + 1][0]) / 2
            else:
                col_y_end = rows[y1][1]
            col_x = column[0] + x0 + (x1 - x0) / 2
            col = (col_y_start, col_x, col_y_end, col_x)
            table_cols.add(col)
            # clear out the lines to split blurred parts for table cell text
            rr, cc = skimage.draw.line(*[int(x) for x in col])
            im_bin_blurred[rr, cc] = 255

        return (table_scope, table_rows, table_cols)

    @staticmethod
    def find_intersections(column, rows, table_cols, table_rows):
        """
        `find_intersections` take the column, and the rows inside the row
        group, together with `table_cols` `table_rows` returned from
        `build_table`, to generate a list of intersections between table
        rows and columns, useful for identifying the cells.

        """
        inters_img_width = column[1] - column[0]
        inters_img_height = rows[-1][1] - rows[0][0]
        inters_img_col_shift = int(column[0])
        inters_img_row_shift = int(rows[0][0])
        inters_img = numpy.ones(shape=(inters_img_height + 1, inters_img_width + 1), dtype=numpy.uint8)
        for row in table_rows:
            inters_img[int(row[0]) - inters_img_row_shift, int(row[1]) - inters_img_col_shift:int(row[3]) - inters_img_col_shift + 1] = 0
        for col in table_cols:
            inters_img[int(col[0]) - inters_img_row_shift:int(col[2]) - inters_img_row_shift + 1, int(col[1]) - inters_img_col_shift] = 0
        cross_p = numpy.array([[1, 0, 1], [0, 0, 0], [1, 0, 1]], dtype=numpy.uint8)
        cross_dw_p = numpy.array([[1, 1, 1], [0, 0, 0], [1, 0, 1]], dtype=numpy.uint8)
        cross_uw_p = numpy.array([[1, 0, 1], [0, 0, 0], [1, 1, 1]], dtype=numpy.uint8)
        cross_lr_p = numpy.array([1, 0, 1], dtype=numpy.uint8)
        cross_tb_p = numpy.array([1, 0, 1], dtype=numpy.uint8)
        intersections = [
            (0, 0),
            (0, inters_img.shape[1] - 1),
            (inters_img.shape[0] - 1, 0),
            (inters_img.shape[0] - 1, inters_img.shape[1] - 1)
        ]
        intersections_upward = set()
        intersections_downward = set()
        for row in range(1, inters_img.shape[0] - 1):
            w = inters_img[row - 1:row + 2, 0]
            if numpy.array_equal(w, cross_lr_p):
                intersections.append((row, 0))
            w = inters_img[row - 1:row + 2, inters_img.shape[1] - 1]
            if numpy.array_equal(w, cross_lr_p):
                intersections.append((row, inters_img.shape[1] - 1))
        for col in range(1, inters_img.shape[1] - 1):
            w = inters_img[0, col - 1:col + 2]
            if numpy.array_equal(w, cross_tb_p):
                intersections.append((0, col))
            w = inters_img[inters_img.shape[0] - 1, col - 1:col + 2]
            if numpy.array_equal(w, cross_tb_p):
                intersections.append((inters_img.shape[0] - 1, col))
        for row in range(1, inters_img.shape[0] - 1):
            for col in range(1, inters_img.shape[1] - 1):
                w = inters_img[row - 1:row + 2, col - 1:col + 2]
                if (numpy.array_equal(w, cross_p) or
                    numpy.array_equal(w, cross_dw_p) or
                    numpy.array_equal(w, cross_uw_p)):
                    intersections.append((row, col))
                    if numpy.array_equal(w, cross_dw_p):
                        intersections_downward.add((row, col))
                    elif numpy.array_equal(w, cross_uw_p):
                        intersections_upward.add((row, col))
        if len(intersections) == 4:
            intersections = []
        # sort by row-first, column-second, number 10000 should be
        # larger than longest possible row width, which guarantees
        # higher sorting priority for the rows
        intersections = sorted(intersections, key=lambda intersections:intersections[0] * 10000 + intersections[1])
        return (intersections, intersections_upward, intersections_downward)

    @staticmethod
    def find_cells(intersections, intersections_upward, intersections_downward):
        intersections_set = set(intersections)
        cells = []
        for inters_idx, (row, col) in enumerate(intersections):
            if (row, col) in intersections_upward:
                continue
            if inters_idx >= len(intersections) - 1:
                continue
            next_col = intersections[inters_idx + 1][1]
            next_row = None
            for i in range(inters_idx + 1, len(intersections)):
                if intersections[i][1] == col:
                    next_row = intersections[i][0]
                    break
            if next_row is not None:
                cells.append((row, col, next_row, next_col))
        return cells


class debug_painter:
    """
    `debug_painter` is a namespace container for painting debug images
    using the results from routines in the `pseg` module.

    """

    @staticmethod
    def columns_from_image(test_img, results):
        (columns, spacings) = results
        for column in columns:
            rr, cc = skimage.draw.rectangle((0, column[0]), (test_img.shape[0], column[1]))
            skimage.draw.set_color(test_img, (rr, cc), (255, 255, 0), 0.5)
        for spacing in spacings:
            rr, cc = skimage.draw.rectangle((0, spacing[0]), (test_img.shape[0], spacing[1]))
            skimage.draw.set_color(test_img, (rr, cc), (0, 255, 0), 0.5)

    @staticmethod
    def row_groups_from_columns(test_img, results):
        (columns, column_row_groups, column_row_vspacings) = results
        for col_idx, row_groups in column_row_groups.items():
            column = columns[col_idx]
            for row_group in row_groups:
                row_group_top = row_group[0][0]
                row_group_bottom = row_group[-1][1]
                rr, cc = skimage.draw.rectangle((row_group_top, column[0]), (row_group_bottom, column[1]))
                skimage.draw.set_color(test_img, (rr, cc), (255, 255, 0), 0.5)
                for row in row_group:
                    rr, cc = skimage.draw.rectangle((row[0], column[0]), (row[1], column[1]))
                    skimage.draw.set_color(test_img, (rr, cc), (0, 255, 0), 0.5)

    @staticmethod
    def row_hspacings_from_row_groups(test_img, results):
        (columns, column_row_groups, column_row_grp_row_spacings) = results
        for col_idx, row_groups in column_row_groups.items():
            column = columns[col_idx]
            for row_grp_idx, row_group in enumerate(row_groups):
                for row_idx, row in enumerate(row_group):
                    row_hspacing = column_row_grp_row_spacings[col_idx][row_grp_idx][row_idx]
                    for i in range(0, row_hspacing.shape[0]):
                        if row_hspacing[i] == 0:
                            continue
                        rr, cc = skimage.draw.line(row[0], column[0] + i, row[1], column[0] + i)
                        skimage.draw.set_color(test_img, (rr, cc), (0, 255, 0), 0.5)

    @staticmethod
    def vertical_lines_from_hspacings(test_img, results):
        (columns, column_row_groups, column_row_grp_row_spacings, fresult) = results
        for col_idx in sorted(column_row_grp_row_spacings):
            column = columns[col_idx]
            for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                if row_grp_idx not in fresult[col_idx]:
                    continue
                rows = column_row_groups[col_idx][row_grp_idx]
                lines = fresult[col_idx][row_grp_idx]
                for ((x0, y0), (x1, y1)) in lines:
                    rr, cc = skimage.draw.line(rows[y0][0], x0 + column[0], rows[y1][1], x1 + column[0])
                    skimage.draw.set_color(test_img, (rr, cc), (255, 0, 0), 0.5)

    @staticmethod
    def tablevspan_common(test_img, results):
        (columns, column_row_groups, column_row_grp_row_spacings, fresult) = results
        for col_idx in sorted(column_row_grp_row_spacings):
            column = columns[col_idx]
            for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                if row_grp_idx not in fresult[col_idx]:
                    continue
                rows = column_row_groups[col_idx][row_grp_idx]
                rects = fresult[col_idx][row_grp_idx]
                for ((x0, y0), (x1, y1)) in rects:
                    rr, cc = skimage.draw.rectangle((rows[y0][0], x0 + column[0]), (rows[y1][1], x1 + column[0]))
                    skimage.draw.set_color(test_img, (rr, cc), helper.get_color_cycle_rgb(), 0.5)

    @staticmethod
    def tablevspan_build_table(test_img, results):
        (columns, column_row_groups, column_row_grp_row_spacings, fresult) = results
        for col_idx in sorted(column_row_grp_row_spacings):
            column = columns[col_idx]
            for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                if col_idx not in fresult:
                    continue
                if row_grp_idx not in fresult[col_idx]:
                    continue
                rows = column_row_groups[col_idx][row_grp_idx]
                (table_scope, table_rows, table_cols) = fresult[col_idx][row_grp_idx]
                for row in table_rows:
                    row = [int(x) for x in row]
                    rr, cc = skimage.draw.line(*row)
                    skimage.draw.set_color(test_img, (rr, cc), (255, 192, 0), 1)
                for col in table_cols:
                    col = [int(x) for x in col]
                    rr, cc = skimage.draw.line(*col)
                    skimage.draw.set_color(test_img, (rr, cc), (255, 0, 0), 1)
                for (row_top_idx, row_bottom_idx) in table_scope:
                    if row_top_idx > 0:
                        table_row_top = (rows[row_top_idx][0] + rows[row_top_idx - 1][1]) / 2
                    else:
                        table_row_top = rows[row_top_idx][0]
                    if row_bottom_idx == len(rows) - 1:
                        table_row_bottom = rows[row_bottom_idx][1]
                    else:
                        table_row_bottom = (rows[row_bottom_idx][1] + rows[row_bottom_idx + 1][0]) / 2
                    rr, cc = skimage.draw.rectangle((int(table_row_top), column[0] - 5), (int(table_row_bottom), column[0]))
                    skimage.draw.set_color(test_img, (rr, cc), helper.get_color_cycle_rgb(), 1)

    @staticmethod
    def tablevspan_find_intersections_find_cells(test_img, results):
        (columns, column_row_groups, column_row_grp_row_spacings, fresult) = results
        for col_idx in sorted(column_row_grp_row_spacings):
            column = columns[col_idx]
            for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                if row_grp_idx not in fresult[col_idx]:
                    continue
                rows = column_row_groups[col_idx][row_grp_idx]
                (intersections, intersections_upward, intersections_downward, cells) = fresult[col_idx][row_grp_idx]
                inters_img_col_shift = int(column[0])
                inters_img_row_shift = int(rows[0][0])
                for (row, col) in intersections:
                    rr, cc = skimage.draw.disk((row + inters_img_row_shift, col + inters_img_col_shift), 3)
                    skimage.draw.set_color(test_img, (rr, cc), (255, 0, 0), 1)
                cells = [(y0 + inters_img_row_shift, x0 + inters_img_col_shift, y1 + inters_img_row_shift, x1 + inters_img_col_shift) for (y0, x0, y1, x1) in cells]
                for (y0, x0, y1, x1) in cells:
                    rr, cc = skimage.draw.rectangle((y0, x0), (y1, x1))
                    skimage.draw.set_color(test_img, (rr, cc), helper.get_color_cycle_rgb(), 0.5)

