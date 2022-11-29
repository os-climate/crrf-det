import numpy
import skimage
import sklearn.cluster
from scipy.spatial import ConvexHull

from tpdf import pseg


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


def row_hspacings_from_row_groups(columns, column_row_groups, im_bin_clear):
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
                row_spacing = numpy.zeros(row_crop.shape[1])   # 0=text, 1=spacing
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
    # find vertical cross-throughs (vertical table lines)
    # `row_hspacings` 1=spacing, 0=content
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
    # sort lines by height, tall to short, prepare to optimize towards line clusters
    if lines:
        lines = sorted(lines, key=lambda lines:(lines[0][1] - lines[1][1]) * lines[0][1])
    return lines


def group_adjacent_lines(lines):
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
    return rects


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


def remove_edge_rectangles(rects):
    # filtering
    filtered_rects = []
    for rect in rects:
        if (rect[0][0] == 0 or
            rect[1][0] == col_crop.shape[1] - 1):
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


def is_first_rectangle_column_filled(rects):
    # heuristics: to count as a table, the first column must be filled
    # to 75%, otherwise disregard everything.
    if not rects:
        return False
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
        return False
    return True


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
        if text_value < 0.1 * row_total:
            filtered_rects.append(((x0, y0), (x1, y1)))
    for rect in filtered_rects:
        rects.remove(rect)
    return rects


for filename in ['tmp/test.2.jpg', 'tmp/test.14.jpg', 'tmp/test.36.jpg', 'tmp/test.68.jpg', 'tmp/test.123.jpg', 'tmp/testde.63.jpg', 'tmp/testde.64.jpg', 'tmp/testus.3.jpg', 'tmp/testus.4.jpg', 'tmp/testus.27.jpg', 'tmp/testus.87.jpg', 'tmp/testus.101.jpg']:
# for filename in ['tmp/test.36.jpg']:

    final_image = skimage.io.imread(filename)
    print("\n", filename, final_image.shape)

    (target_scale, im_bin_clear, im_bin_blurred) = pseg.prepare_images_for_segmentation(final_image)
    skimage.io.imsave(filename.replace('test', 'bin_clear'), skimage.util.img_as_ubyte(im_bin_clear))
    skimage.io.imsave(filename.replace('test', 'bin_blurred'), im_bin_blurred)

    # page-level column detection
    (columns, spacings) = pseg.columns_from_image(im_bin_clear)
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


    column_row_grp_row_spacings = row_hspacings_from_row_groups(columns, column_row_groups, im_bin_clear)

    for col_idx in sorted(column_row_grp_row_spacings):
        column = columns[col_idx]
        col_crop = im_bin_clear[0:im_bin_clear.shape[0], column[0]:column[1]]
        for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
            rows = column_row_groups[col_idx][row_grp_idx]
            row_hspacings = column_row_grp_row_spacings[col_idx][row_grp_idx]

            # paint row_hspacings debug image
            for row_idx, row in enumerate(rows):
                row_crop = col_crop[row[0]:row[1], :]
                row_spacing = row_hspacings[row_idx]
                for i in range(0, row_crop.shape[1]):
                    if row_spacing[i]:
                        x0 = x1 = i
                        y0 = 0
                        y1 = row_crop.shape[0]
                        rr, cc = skimage.draw.line(y0, x0, y1, x1)
                        cc += column[0]
                        rr += row[0]
                        skimage.draw.set_color(cd_image, (rr, cc), color_cycle.get_vvrgb(6), 1)

            # find vertical cross-throughs (vertical table lines)
            lines = vertical_lines_from_hspacings(row_hspacings)

            if not lines:
                continue

            # group adjacent lines in the same height, into rectangles
            rects = group_adjacent_lines(lines)

            # build a lookup table of adjacent, smaller rectangles
            # remove all adjacent smaller rectangles, keeping only the largest one
            rects = remove_smaller_adjacent_rectangles(rects)

            rects = remove_edge_rectangles(rects)

            # heuristics: to count as a table, the first column must be filled
            # to 75%, otherwise disregard everything.
            if not is_first_rectangle_column_filled(rects):
                rects = []

            # find "busyness" of rect neighboring columns, if too busy, the
            # rect is likely a misinterpretation because table texts are likely
            # to be scattered.
            rects = remove_busy_column_rectangles(rects, row_hspacings)

            row_hspacings_img = skimage.color.gray2rgb(skimage.util.img_as_ubyte(row_hspacings))
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
