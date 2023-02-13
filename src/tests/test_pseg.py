import os
import numpy
import skimage
import unittest

from tpdf import pseg, helper


class TestPSeg(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.image_cache = {}
        cls.result_cache = {}
        cls.basepath = os.path.dirname(__file__)
        all_images = ['tsla2021.2.png', 'tsla2021.14.png', 'tsla2021.36.png', 'tsla2021.68.png', 'tsla2021.73.png', 'tsla2021.122.png', 'tsla2021.123.png', 'tsla2021.141.png', 'de2021.63.png', 'de2021.64.png', 'x2021.27.png', 'x2021.64.png', 'x2021.87.png', 'cargill2022.15.png', 'cargill2022.73.png', 'cargill2022.83.png', 'cargill2022.97.png', 'eog2021.9.png', 'eog2021.16.png', 'eog2021.68.png', 'eog2021.70.png']
        for fn in all_images:
            fnp = os.path.join(cls.basepath, 'src_imgs', fn)
            img = skimage.io.imread(fnp)
            (im_bin_clear, im_bin_blurred) = pseg.prepare_images_for_segmentation(img)
            test_img = skimage.color.gray2rgb(im_bin_clear)
            cls.image_cache[fn] = (im_bin_clear, im_bin_blurred, test_img)

    @classmethod
    def tearDownClass(cls):
        pass

    def _get_image(self, fn):
        (im_bin_clear, im_bin_blurred, test_img) = self.image_cache[fn]
        return (im_bin_clear, im_bin_blurred, numpy.array(test_img)) 

    def test_01_columns_from_image(self):
        t_columns_from_image = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.68.png': {},
            'tsla2021.73.png': {},
            'tsla2021.122.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.64.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.68.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['columns_from_image'] = {}
        for fn in t_columns_from_image:
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = pseg.columns_from_image(im_bin_clear)
            pseg.debug_painter.columns_from_image(test_img, (columns, spacings))
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_01_columns_from_image.test.png')
            skimage.io.imsave(ofn, test_img)
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_01_columns_from_image.png')
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image {}".format(ref_fn))
            os.remove(ofn)
            self.result_cache['columns_from_image'][fn] = (columns, spacings)

    def test_02_row_groups_from_columns(self):
        t_row_groups_from_columns = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.68.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.68.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['row_groups_from_columns'] = {}
        for fn in t_row_groups_from_columns:
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            column_row_groups, column_row_vspacings = pseg.row_groups_from_columns(columns, im_bin_clear)
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_02_row_groups_from_columns.test.png')
            pseg.debug_painter.row_groups_from_columns(test_img, (columns, column_row_groups, column_row_vspacings))
            skimage.io.imsave(ofn, test_img)
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_02_row_groups_from_columns.png')
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)
            self.result_cache['row_groups_from_columns'][fn] = (column_row_groups, column_row_vspacings)

    def test_03_row_hspacings_from_row_groups(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['row_hspacings_from_row_groups'] = {}
        for fn in test_list:
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = pseg.row_hspacings_from_row_groups(columns, column_row_groups, im_bin_clear)
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_03_row_hspacings_from_row_groups.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_03_row_hspacings_from_row_groups.png')
            pseg.debug_painter.row_hspacings_from_row_groups(test_img, (columns, column_row_groups, column_row_grp_row_spacings))
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)
            self.result_cache['row_hspacings_from_row_groups'][fn] = column_row_grp_row_spacings

    def test_04_vertical_lines_from_hspacings(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['vertical_lines_from_hspacings'] = {}
        for fn in test_list:
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_04_vertical_lines_from_hspacings.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_04_vertical_lines_from_hspacings.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    row_hspacings = column_row_grp_row_spacings[col_idx][row_grp_idx]
                    lines = pseg.vertical_lines_from_hspacings(row_hspacings)
                    fresult[col_idx][row_grp_idx] = lines
            self.result_cache['vertical_lines_from_hspacings'][fn] = fresult
            pseg.debug_painter.vertical_lines_from_hspacings(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan01_group_adjacent_lines(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_group_adjacent_lines'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan01_group_adjacent_lines.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan01_group_adjacent_lines.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    lines = self.result_cache['vertical_lines_from_hspacings'][fn][col_idx][row_grp_idx]
                    rects = pseg.tablevspan.group_adjacent_lines(lines)
                    fresult[col_idx][row_grp_idx] = rects
            pseg.debug_painter.tablevspan_common(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_group_adjacent_lines'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan02_remove_smaller_adjacent_rectangles(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_remove_smaller_adjacent_rectangles'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan02_remove_smaller_adjacent_rectangles.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan02_remove_smaller_adjacent_rectangles.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx in sorted(column_row_grp_row_spacings[col_idx]):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    rects = self.result_cache['tablevspan_group_adjacent_lines'][fn][col_idx][row_grp_idx]
                    rects = pseg.tablevspan.remove_smaller_adjacent_rectangles(rects)
                    fresult[col_idx][row_grp_idx] = rects
            pseg.debug_painter.tablevspan_common(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_remove_smaller_adjacent_rectangles'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan03_remove_edge_rectangles(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'tsla2021.141.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_remove_edge_rectangles'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan03_remove_edge_rectangles.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan03_remove_edge_rectangles.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx, row_hspacings in sorted(column_row_grp_row_spacings[col_idx].items()):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    rects = self.result_cache['tablevspan_remove_smaller_adjacent_rectangles'][fn][col_idx][row_grp_idx]
                    rects = pseg.tablevspan.remove_edge_rectangles(rects, row_hspacings)
                    fresult[col_idx][row_grp_idx] = rects
            pseg.debug_painter.tablevspan_common(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_remove_edge_rectangles'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan04_is_first_rectangle_column_valid(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.9.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_is_first_rectangle_column_valid'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan04_is_first_rectangle_column_valid.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan04_is_first_rectangle_column_valid.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx, row_hspacings in sorted(column_row_grp_row_spacings[col_idx].items()):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    rects = self.result_cache['tablevspan_remove_edge_rectangles'][fn][col_idx][row_grp_idx]
                    while True:
                        if not rects:
                            break
                        if not pseg.tablevspan.is_first_rectangle_column_valid(rects, row_hspacings):
                            rects = rects[1:]
                            continue
                        break
                    fresult[col_idx][row_grp_idx] = rects
            pseg.debug_painter.tablevspan_common(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_is_first_rectangle_column_valid'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan05_remove_busy_column_rectangles(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.png': {},
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'de2021.63.png': {},
            'de2021.64.png': {},
            'x2021.27.png': {},
            'x2021.87.png': {},
            'cargill2022.15.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'cargill2022.97.png': {},
            'eog2021.16.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_remove_busy_column_rectangles'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan05_remove_busy_column_rectangles.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan05_remove_busy_column_rectangles.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx, row_hspacings in sorted(column_row_grp_row_spacings[col_idx].items()):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    rects = self.result_cache['tablevspan_is_first_rectangle_column_valid'][fn][col_idx][row_grp_idx]
                    rects = pseg.tablevspan.remove_busy_column_rectangles(rects, row_hspacings)
                    fresult[col_idx][row_grp_idx] = rects
            pseg.debug_painter.tablevspan_common(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_remove_busy_column_rectangles'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan06_build_table(self):
        # image based test, no values
        test_list = {
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'de2021.64.png': {},
            'x2021.87.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_build_table'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan06_build_table.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan06_build_table.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx, row_hspacings in sorted(column_row_grp_row_spacings[col_idx].items()):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    rects = self.result_cache['tablevspan_remove_busy_column_rectangles'][fn][col_idx][row_grp_idx]
                    (table_rows, table_cols) = pseg.tablevspan.build_table(column, rows, row_hspacings, rects, im_bin_blurred)
                    fresult[col_idx][row_grp_idx] = (table_rows, table_cols)
            pseg.debug_painter.tablevspan_build_table(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_build_table'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan07_find_intersections_find_cells(self):
        # image based test, no values
        test_list = {
            'tsla2021.14.png': {},
            'tsla2021.36.png': {},
            'tsla2021.73.png': {},
            'tsla2021.123.png': {},
            'de2021.64.png': {},
            'x2021.87.png': {},
            'cargill2022.73.png': {},
            'cargill2022.83.png': {},
            'eog2021.70.png': {},
        }
        self.result_cache['tablevspan_find_intersections_find_cells'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            (column_row_groups, column_row_vspacings) = self.result_cache['row_groups_from_columns'][fn]
            column_row_grp_row_spacings = self.result_cache['row_hspacings_from_row_groups'][fn]
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan07_find_intersections_find_cells.test.png')
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_05_tablevspan07_find_intersections_find_cells.png')
            fresult = {}
            for col_idx in sorted(column_row_grp_row_spacings):
                fresult[col_idx] = {}
                column = columns[col_idx]
                for row_grp_idx, row_hspacings in sorted(column_row_grp_row_spacings[col_idx].items()):
                    rows = column_row_groups[col_idx][row_grp_idx]
                    (table_rows, table_cols) = self.result_cache['tablevspan_build_table'][fn][col_idx][row_grp_idx]
                    (intersections, intersections_upward, intersections_downward) = pseg.tablevspan.find_intersections(column, rows, table_cols, table_rows)
                    cells = pseg.tablevspan.find_cells(intersections, intersections_upward, intersections_downward)
                    fresult[col_idx][row_grp_idx] = (intersections, intersections_upward, intersections_downward, cells)
            pseg.debug_painter.tablevspan_find_intersections_find_cells(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_find_intersections_find_cells'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)
