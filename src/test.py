import numpy
import skimage
import sklearn.cluster
from scipy.spatial import ConvexHull


COLORS = [
    '1f77b4',
    'ff7f0e',
    '2ca02c',
    'd62728',
    '9467bd',
    '8c564b',
    'e377c2',
    '7f7f7f',
    'bcbd22',
    '17becf',
]
COLOR_IDX = -1
# from https://www.schemecolor.com
VV_COLORS = [
    'eb3d25',
    'ef8232',
    'e24092',
    '751b7c',
    '2463bf',
    '4db0d0',
    '4ca730',
    'a3de45',
    'f8cf47',
    '722bf5',
    'c4c4c4',
    '543317'
]


class color_cycle:

    @staticmethod
    def get_rgb(index=None):
        global COLORS
        global COLOR_IDX
        if index is None:
            COLOR_IDX += 1
            if COLOR_IDX >= len(COLORS):
                COLOR_IDX = 0
            s_ = COLORS[COLOR_IDX]
        else:
            s_ = COLORS[index]
        return tuple(int(s_[i:i + 2], 16) for i in (0, 2, 4))


    @staticmethod
    def get_vvrgb(index):
        global VV_COLORS
        s_ = VV_COLORS[index]
        return tuple(int(s_[i:i + 2], 16) for i in (0, 2, 4))


def kmean_binarize(clusters, image):
    image_rs = image.reshape((image.shape[0] * image.shape[1], 1))
    km = sklearn.cluster.KMeans(n_clusters=clusters, random_state=0).fit(image_rs)

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


def columns_from_image(im_bin_clear):
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


def row_groups_from_columns(columns, im_bin_clear):
    MAX_ROW_VSPACING = 25
    row_marker = numpy.array(color_cycle.get_vvrgb(7))
    column_row_groups = {}
    column_row_vspacings = {}
    for col_idx, column in enumerate(columns):
        col_crop = im_bin_clear[0:im_bin_clear.shape[0], column[0]:column[1]]
        col_sum = col_crop.shape[1] * 255
        # vertical spacings between rows, in pixels: 0=text, 1=spacing
        row_vspacings = numpy.zeros(col_crop.shape[0], dtype=int)
        for i in range(0, col_crop.shape[0]):
            if numpy.sum(col_crop[i, :]) == col_sum:
                row_vspacings[i] = 1
        column_row_vspacings[col_idx] = row_vspacings
        # group rows that have tight spacing, a bet to separate multiple tables
        # in the same column
        row_groups = []
        rows = []
        cur_row = []    # list: 0=row begin, 1=row end
        last_row_end = 0
        for i in range(0, col_crop.shape[0]):
            # encounter a row marker
            #if numpy.array_equal(cd_image[i, column[0]], row_marker):
            if row_vspacings[i] == 1:
                if len(cur_row) == 2:
                    last_row_end = i
                    rows.append(cur_row)
                cur_row = []
            # encounter a text row of pixels
            elif i > 0:
                if len(cur_row) == 0:
                    # begin of a new row
                    if i - last_row_end >= MAX_ROW_VSPACING:
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


def prepare_images_for_segmentation(source_image):
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


for filename in ['tmp/test.2.jpg', 'tmp/test.14.jpg', 'tmp/test.36.jpg', 'tmp/test.68.jpg', 'tmp/test.123.jpg', 'tmp/testde.63.jpg', 'tmp/testde.64.jpg', 'tmp/testus.3.jpg', 'tmp/testus.4.jpg', 'tmp/testus.27.jpg', 'tmp/testus.87.jpg', 'tmp/testus.101.jpg']:
# for filename in ['tmp/test.36.jpg']:

    final_image = skimage.io.imread(filename)
    print("\n", filename, final_image.shape)

    (target_scale, im_bin_clear, im_bin_blurred) = prepare_images_for_segmentation(final_image)
    skimage.io.imsave(filename.replace('test', 'bin_clear'), skimage.util.img_as_ubyte(im_bin_clear))
    skimage.io.imsave(filename.replace('test', 'bin_blurred'), im_bin_blurred)

    # page-level column detection
    (columns, spacings) = columns_from_image(im_bin_clear)
    cd_image = skimage.color.gray2rgb(im_bin_clear)
    # debug image for page-level column detection
    for [spacing_left, spacing_right] in spacings:
        rr, cc = skimage.draw.rectangle((0, spacing_left), (cd_image.shape[0], spacing_right))
        skimage.draw.set_color(cd_image, (rr, cc), color_cycle.get_vvrgb(8), 1)
    skimage.io.imsave(filename.replace('test', 'cd'), skimage.util.img_as_ubyte(cd_image))
    # end of column detection

    # clear `blurred` and `im_bin_blurred` to avoid blurring bleeding edges to
    # interfere with column based processing
    for [spacing_left, spacing_right] in spacings:
        im_bin_blurred[:, spacing_left:spacing_right] = 255
        im_bin_clear[:, spacing_left:spacing_right] = 255

    # for each column, detect inter-paragraph, inter-table vertical spacing
    # between rows
    column_row_groups, column_row_vspacings = row_groups_from_columns(columns, im_bin_clear)
    # debug: paint row spacing for each column
    for col_idx, column in enumerate(columns):
        row_vspacings = column_row_vspacings[col_idx]
        row_groups = column_row_groups[col_idx]
        print('  column:', column, ', rows {} groups:'.format(len(row_groups)), row_groups)
        for i in range(0, im_bin_clear.shape[0]):
            if row_vspacings[i] == 1:
                y0 = y1 = i
                x0 = column[0]
                x1 = column[1]
                rr, cc = skimage.draw.line(y0, x0, y1, x1)
                skimage.draw.set_color(cd_image, (rr, cc), color_cycle.get_vvrgb(7), 1)


    for col_idx, column in enumerate(columns):
        col_crop = im_bin_clear[0:im_bin_clear.shape[0], column[0]:column[1]]

        for row_grp_idx, rows in enumerate(column_row_groups[col_idx]):
            # find horizontal spacing (between characters, words, or table cells)
            # in each row
            row_hspacings = []  # all spacings for all rows within this column
                                # can be used to identify tabular structure through
                                # overlapping
            for row in rows:
                row_crop = col_crop[row[0]:row[1], :]
                row_sum = row_crop.shape[0] * 255
                row_spacing = numpy.zeros(row_crop.shape[1])   # 0=text, 1=spacing
                for i in range(0, row_crop.shape[1]):
                    if numpy.sum(row_crop[:, i]) == row_sum:    # all white
                        row_spacing[i] = 1
                # eliminate narrow spacing
                min_spacing_span = 5
                for spacing_span in range(1, min_spacing_span):
                    for i in range(spacing_span, row_crop.shape[1] - spacing_span):
                        if (numpy.sum(row_spacing[i - spacing_span:i + spacing_span + 1]) <= spacing_span and
                            row_spacing[i - spacing_span] == 0 and
                            row_spacing[i + spacing_span] == 0):
                            row_spacing[i - spacing_span:i + spacing_span + 1] = 0
                row_hspacings.append(row_spacing)
                for i in range(0, row_crop.shape[1]):
                    if row_spacing[i]:
                        x0 = x1 = i
                        y0 = 0
                        y1 = row_crop.shape[0]
                        rr, cc = skimage.draw.line(y0, x0, y1, x1)
                        cc += column[0]
                        rr += row[0]
                        skimage.draw.set_color(cd_image, (rr, cc), color_cycle.get_vvrgb(6), 1)

            if not row_hspacings:
                continue

            # find vertical cross-throughs (vertical table lines)
            # `row_hspacings` 1=spacing, 0=content
            row_hspacings = numpy.array(row_hspacings)
            row_hspacings_img = skimage.color.gray2rgb(skimage.util.img_as_ubyte(row_hspacings))
            lines = []
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

            if not lines:
                continue

            # sort lines by height, tall to short, prepare to optimize towards line clusters
            lines = sorted(lines, key=lambda lines:(lines[0][1] - lines[1][1]) * lines[0][1])
            # lines = sorted(lines, key=lambda lines:(lines[0][1] - lines[1][1]))

            # group adjacent lines in the same height, into rectangles
            rects = []
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

            # filtering
            filtered_rects = []
            for rect in rects:
                if (rect[0][0] == 0 or
                    rect[1][0] == col_crop.shape[1] - 1):
                    # skip grouped lines touching left / right of the column,
                    # as they provide no useful information
                    filtered_rects.append(rect)
            for rect in filtered_rects:
                rects.remove(rect)

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

            # heuristics: to count as a table, the first column must be filled
            # to 75%, otherwise disregard everything.
            if rects:
                filled_count = 0
                ((x0, y0), (x1, y1)) = rects[0]
                height = 0.75 * (y1 - y0 + 1)
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
                    height2 = 0.75 * (y1 - y0 + 1)
                    white_sum = x0
                    for i in range(y0, y1 + 1):
                        is_filled = numpy.sum(row_hspacings[i, 0:x0]) < white_sum
                        if is_filled:
                            filled_count2 += 1
                if (filled_count < height and
                    filled_count2 < height2):
                    rects = []

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
                if text_value < 0.1 * row_total:
                    filtered_rects.append(((x0, y0), (x1, y1)))
            for rect in filtered_rects:
                rects.remove(rect)

            # enumerate all rects for covered row spacings, use them to clear out
            # the blurred version so that table cell texts are no longer sticked
            # together
            clearing_rows = set()
            for ((x0, y0), (x1, y1)) in rects:
                for i in range(y0, y1):
                    clearing_rows.add((rows[i][1] + rows[i + 1][0]) / 2)
            for row_y in clearing_rows:
                rr, cc = skimage.draw.line(int(row_y), column[0], int(row_y), column[1])
                # clear out the lines to split blurred parts for table cell text
                im_bin_blurred[rr, cc] = 255

                row_y *= target_scale
                rr, cc = skimage.draw.rectangle((int(row_y - 1), int(column[0] * target_scale)), (int(row_y + 1), int(column[1] * target_scale)))
                skimage.draw.set_color(final_image, (rr, cc), (255, 192, 0), 1)

            for ((x0, y0), (x1, y1)) in lines:
                rr, cc = skimage.draw.line(y0, x0, y1, x1)
                skimage.draw.set_color(row_hspacings_img, (rr, cc), color_cycle.get_vvrgb(9), 1)

            for ((x0, y0), (x1, y1)) in rects:
                rr, cc = skimage.draw.rectangle((y0, x0), (y1, x1))
                skimage.draw.set_color(row_hspacings_img, (rr, cc), color_cycle.get_rgb(), 1)

                table_line_y_start = rows[y0][0]
                table_line_y_end = rows[y1][1] + 1
                table_line_x = column[0] + x0 + (x1 - x0) / 2
                rr, cc = skimage.draw.line(int(table_line_y_start), int(table_line_x), int(table_line_y_end), int(table_line_x))
                # clear out the lines to split blurred parts for table cell text
                im_bin_blurred[rr, cc] = 255

                table_line_y_start *= target_scale
                table_line_y_end *= target_scale
                table_line_x *= target_scale
                rr, cc = skimage.draw.rectangle((int(table_line_y_start), int(table_line_x) - 1), (int(table_line_y_end), int(table_line_x) + 1))
                skimage.draw.set_color(final_image, (rr, cc), (255, 0, 0), 1)

            skimage.io.imsave(filename.replace('test', 'cd_rows_col' + str(col_idx) + '_grp' + str(row_grp_idx)).replace('jpg', 'png'), row_hspacings_img)
    skimage.io.imsave(filename.replace('test', 'cd_rows'), skimage.util.img_as_ubyte(cd_image))
    # end of paragraph spacing detection


    contours = skimage.measure.find_contours(im_bin_blurred)

    for contour in contours:
        # test the contour against the "bin_clear" image, if the covered
        # region is all white, we can safely ignore it
        rr, cc = skimage.draw.polygon(contour[:, 0], contour[:, 1])
        if numpy.all(im_bin_clear[rr, cc] == 255):
            continue
        hull = ConvexHull(contour)
        vertices = contour[hull.vertices,:]
        vertices *= target_scale
        color = color_cycle.get_rgb()
        rr, cc = skimage.draw.polygon(vertices[:, 0], vertices[:, 1])
        skimage.draw.set_color(final_image, (rr, cc), color, 0.3)

    skimage.io.imsave(filename.replace('test', 'out'), final_image)
