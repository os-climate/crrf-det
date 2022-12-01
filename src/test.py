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
    pseg.clear_column_spacing(spacings, im_bin_clear, im_bin_blurred)

    # for each column, detect inter-paragraph, inter-table vertical spacing
    # between rows
    column_row_groups, column_row_vspacings = pseg.row_groups_from_columns(columns, im_bin_clear)
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


    column_row_grp_row_spacings = pseg.row_hspacings_from_row_groups(columns, column_row_groups, im_bin_clear)

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
            lines = pseg.vertical_lines_from_hspacings(row_hspacings)

            if not lines:
                continue

            # group adjacent lines in the same height, into rectangles
            rects = pseg.tablevspan.group_adjacent_lines(lines)

            # build a lookup table of adjacent, smaller rectangles
            # remove all adjacent smaller rectangles, keeping only the largest one
            rects = pseg.tablevspan.remove_smaller_adjacent_rectangles(rects)

            rects = pseg.tablevspan.remove_edge_rectangles(rects, row_hspacings)

            # heuristics: to count as a table, the first column must be filled
            # to 75%, otherwise disregard everything.
            if not pseg.tablevspan.is_first_rectangle_column_filled(rects, row_hspacings):
                rects = []

            # find "busyness" of rect neighboring columns, if too busy, the
            # rect is likely a misinterpretation because table texts are likely
            # to be scattered.
            rects = pseg.tablevspan.remove_busy_column_rectangles(rects, row_hspacings)

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
