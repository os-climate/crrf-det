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
        all_images = ['tsla2021.2.jpg', 'tsla2021.14.jpg', 'tsla2021.36.jpg', 'tsla2021.68.jpg', 'tsla2021.123.jpg', 'de2021.63.jpg', 'de2021.64.jpg', 'x2021.27.jpg', 'x2021.87.jpg', 'cargill2022.15.jpg', 'cargill2022.73.jpg', 'cargill2022.83.jpg', 'cargill2022.97.jpg', 'eog2021.9.jpg']
        for fn in all_images:
            fnp = os.path.join(cls.basepath, 'src_imgs', fn)
            img = skimage.io.imread(fnp)
            (target_scale, im_bin_clear, im_bin_blurred) = pseg.prepare_images_for_segmentation(img)
            test_img = skimage.color.gray2rgb(im_bin_clear)
            cls.image_cache[fn] = (target_scale, im_bin_clear, im_bin_blurred, test_img)

    @classmethod
    def tearDownClass(cls):
        pass

    def _get_image(self, fn):
        (target_scale, im_bin_clear, im_bin_blurred, test_img) = self.image_cache[fn]
        return (target_scale, im_bin_clear, im_bin_blurred, numpy.array(test_img)) 

    def test_01_columns_from_image(self):
        t_columns_from_image = {
            'tsla2021.2.jpg': ([[24, 143], [180, 407], [433, 660]], [[0, 24], [143, 180], [407, 433], [660, 710]]),
            'tsla2021.14.jpg': ([[24, 226], [259, 675]], [[0, 24], [226, 259], [675, 710]]),
            'tsla2021.36.jpg': ([[25, 691]], [[0, 25], [691, 710]]),
            'tsla2021.68.jpg': ([[25, 105], [259, 680]], [[0, 25], [105, 259], [680, 710]]),
            'tsla2021.123.jpg': ([[24, 687]], [[0, 24], [687, 710]]),
            'de2021.63.jpg': ([[39, 346], [388, 396]], [[0, 39], [346, 388]]),
            'de2021.64.jpg': ([[21, 374]], [[0, 21], [374, 399]]),
            'x2021.27.jpg': ([[250, 299], [362, 517], [536, 550], [580, 689]], [[0, 250], [299, 362], [517, 536], [550, 580], [689, 710]]),
            'x2021.87.jpg': ([[22, 229], [268, 689]], [[0, 22], [229, 268], [689, 710]]),
            'cargill2022.15.jpg': ([[20, 494]], [[0, 20], [494, 516]]),
            'cargill2022.73.jpg': ([[22, 487]], [[0, 22], [487, 516]]),
            'cargill2022.83.jpg': ([[22, 499]], [[0, 22], [499, 516]]),
            'cargill2022.97.jpg': ([[22, 492]], [[0, 22], [492, 516]]),
            'eog2021.9.jpg': ([[30, 292], [316, 574], [622, 628]], [[0, 30], [292, 316], [574, 622]]),
        }
        self.result_cache['columns_from_image'] = {}
        for fn, (r_columns, r_spacings) in t_columns_from_image.items():
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = pseg.columns_from_image(im_bin_clear)
            pseg.debug_painter.columns_from_image(test_img, (columns, spacings))
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_01_columns_from_image.test.png')
            skimage.io.imsave(ofn, test_img)
            self.assertEqual(r_columns, columns, msg="mismatched columns for file: {}".format(fn))
            self.assertEqual(r_spacings, spacings, msg="mismatched spacings for file: {}".format(fn))
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_01_columns_from_image.png')
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image {}".format(ref_fn))
            os.remove(ofn)
            self.result_cache['columns_from_image'][fn] = (columns, spacings)

    def test_02_row_groups_from_columns(self):
        t_row_groups_from_columns = {
            'tsla2021.2.jpg': {
                0: [[[23, 31], [45, 52], [56, 65], [67, 75], [78, 86], [89, 97], [99, 106], [110, 119]], [[379, 382]]],
                1: [[[23, 30], [43, 50], [53, 59], [63, 69], [73, 79], [92, 99], [103, 109], [112, 118], [122, 128], [142, 148], [152, 158], [162, 168], [171, 177], [181, 188], [192, 198], [201, 207], [221, 228], [231, 237], [241, 247], [251, 257], [270, 277], [281, 287], [300, 306], [310, 317], [319, 326], [330, 335], [349, 356]]],
                2: [[[23, 30], [43, 50], [53, 59], [63, 69], [73, 79], [92, 99], [103, 109], [112, 118], [122, 128], [132, 139], [142, 147], [152, 158], [162, 167], [171, 178], [192, 198], [201, 207], [211, 217], [221, 228], [231, 237], [251, 257], [260, 267], [270, 277], [281, 287], [300, 306], [310, 317], [320, 326], [330, 336], [340, 346]]]
            },
            'tsla2021.14.jpg': {
                0: [[[23, 31], [34, 42]], [[69, 126], [129, 140], [146, 157], [163, 173], [179, 190], [195, 206], [212, 223], [232, 236], [245, 263]], [[379, 382]]],
                1: [[[23, 29], [43, 50], [53, 60], [63, 69], [73, 79], [83, 89], [92, 99], [103, 109], [112, 119], [122, 128], [142, 149], [162, 168], [172, 178], [181, 188], [192, 198]]]
            },
            'tsla2021.36.jpg': {
                0: [[[23, 31], [34, 50], [53, 60], [63, 69], [73, 79], [92, 99], [103, 109], [112, 119], [122, 128], [132, 139], [142, 148]], [[181, 186], [189, 252], [256, 262], [266, 274], [278, 286], [289, 295], [300, 308], [311, 317], [322, 328], [333, 339], [344, 352], [355, 362], [366, 373], [378, 385]]]
            },
            'tsla2021.68.jpg': {
                0: [[[23, 29], [35, 43]], [[379, 382]]],
                1: [[[23, 30], [33, 39], [43, 50], [53, 60], [63, 69], [83, 89], [92, 99], [103, 109], [112, 119], [132, 139], [142, 149], [152, 158], [162, 168], [172, 178]], [[206, 213], [236, 243], [262, 275], [287, 309], [318, 323], [325, 330], [332, 336], [338, 343]]]
            },
            'tsla2021.123.jpg': {
                0: [[[23, 31], [34, 43], [45, 50], [58, 68], [73, 78], [82, 86], [91, 95], [101, 104]], [[120, 125], [134, 144], [149, 153], [158, 162], [167, 171], [186, 191], [200, 204], [209, 213], [228, 233], [242, 247], [251, 255]], [[271, 275], [284, 295], [299, 302]], [[375, 390]]]
            },
            'de2021.63.jpg': {
                0: [[[42, 53], [65, 78], [80, 93], [95, 101]], [[126, 136], [149, 213], [215, 249], [251, 271], [273, 459]]],
                1: [[[225, 228], [231, 235], [237, 254], [256, 265], [267, 271], [273, 278], [280, 284]]]
            },
            'de2021.64.jpg': {
                0: [[[18, 28], [42, 46], [53, 58], [65, 70], [76, 81], [88, 93], [99, 104], [110, 115], [122, 127], [133, 138], [144, 149], [156, 160], [167, 171], [178, 183], [189, 194], [199, 219], [230, 234], [242, 247], [253, 258], [265, 269], [276, 279], [287, 292], [298, 302], [309, 313], [320, 324], [331, 336], [343, 347], [354, 359], [365, 370], [376, 380], [387, 392], [397, 402], [408, 411], [418, 422], [428, 433], [438, 443], [445, 454], [462, 466], [470, 475], [479, 484], [488, 493]]]
            },
            'x2021.27.jpg': {
                0: [[[184, 188], [191, 199], [201, 207], [212, 220]]],
                1: [[[72, 77], [81, 86], [89, 94], [98, 103], [106, 112], [115, 120], [124, 129], [141, 146], [150, 155], [158, 163], [167, 172], [176, 181], [184, 189], [193, 198], [202, 205], [219, 224], [227, 233], [236, 241], [245, 250], [253, 259], [262, 267], [271, 275], [279, 285], [288, 293], [297, 302], [305, 310], [314, 319], [322, 328], [340, 345], [348, 354], [357, 362], [366, 371]]],
                2: [[[105, 171]], [[253, 295], [333, 376]]],
                3: [[[80, 84], [97, 102], [104, 109]], [[128, 132], [134, 139], [159, 172], [194, 199]], [[224, 236], [241, 262], [264, 285], [290, 294]], [[321, 327], [352, 357], [379, 383]]]
            },
            'x2021.87.jpg': {
                0: [[[40, 44], [50, 60]], [[102, 106], [118, 123]]],
                1: [[[102, 106], [118, 123], [127, 132], [135, 141], [144, 149], [163, 168], [177, 183], [190, 194], [202, 207], [214, 220], [227, 232], [239, 244], [251, 256], [264, 269], [276, 281], [288, 294], [300, 304], [312, 317]], [[379, 383]]]
            },
            'cargill2022.15.jpg': {
                0: [[[43, 65], [68, 90], [93, 97]], [[116, 123], [141, 147], [157, 163], [172, 192], [197, 203], [206, 211], [214, 219], [231, 237], [239, 250], [255, 261], [264, 269], [272, 278], [289, 295], [298, 312], [314, 319], [323, 328]], [[349, 353], [355, 359], [362, 366], [368, 372]]]
            },
            'cargill2022.73.jpg': {
                0: [[[43, 63]], [[81, 91], [99, 104], [107, 112], [116, 153]], [[170, 176], [186, 194], [198, 206], [208, 216], [222, 237], [244, 249], [256, 260], [263, 271], [278, 297], [301, 306], [318, 325], [327, 335], [342, 356]]]
            },
            'cargill2022.83.jpg': {
                0: [[[43, 97], [99, 170], [173, 221], [235, 243], [248, 256], [258, 273], [277, 284], [289, 294], [300, 305], [311, 317], [323, 328], [330, 336], [341, 349], [351, 357], [360, 378]]]
            },
            'cargill2022.97.jpg': {
                0: [[[39, 52], [60, 65], [68, 74], [85, 106], [117, 123], [126, 140], [142, 148], [158, 165], [167, 173], [175, 180], [192, 197], [200, 214], [224, 230], [233, 239], [241, 246], [249, 255], [257, 263], [274, 280], [282, 288], [291, 296], [307, 312], [315, 321]], [[348, 354], [361, 370], [372, 377]]]
            },
        }
        self.result_cache['row_groups_from_columns'] = {}
        for fn, r_column_row_groups in t_row_groups_from_columns.items():
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
            (columns, spacings) = self.result_cache['columns_from_image'][fn]
            column_row_groups, column_row_vspacings = pseg.row_groups_from_columns(columns, im_bin_clear)
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_02_row_groups_from_columns.test.png')
            pseg.debug_painter.row_groups_from_columns(test_img, (columns, column_row_groups, column_row_vspacings))
            skimage.io.imsave(ofn, test_img)
            for col_idx, row_groups in column_row_groups.items():
                self.assertEqual(row_groups, r_column_row_groups[col_idx], msg="mismatched row_groups for column: {}, file: {}".format(col_idx, fn))
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_02_row_groups_from_columns.png')
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)
            self.result_cache['row_groups_from_columns'][fn] = (column_row_groups, column_row_vspacings)

    def test_03_row_hspacings_from_row_groups(self):
        # image based test, no values
        test_list = {
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['row_hspacings_from_row_groups'] = {}
        for fn in test_list:
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['vertical_lines_from_hspacings'] = {}
        for fn in test_list:
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['tablevspan_group_adjacent_lines'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['tablevspan_remove_smaller_adjacent_rectangles'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['tablevspan_remove_edge_rectangles'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['tablevspan_is_first_rectangle_column_valid'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.2.jpg': {},
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.63.jpg': {},
            'de2021.64.jpg': {},
            'x2021.27.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.15.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
            'cargill2022.97.jpg': {},
        }
        self.result_cache['tablevspan_remove_busy_column_rectangles'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.64.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
        }
        self.result_cache['tablevspan_build_table'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
                    (table_scope, table_rows, table_cols) = pseg.tablevspan.build_table(column, rows, row_hspacings, rects, im_bin_blurred)
                    fresult[col_idx][row_grp_idx] = (table_scope, table_rows, table_cols)
            pseg.debug_painter.tablevspan_build_table(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_build_table'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)

    def test_05_tablevspan07_find_intersections_find_cells(self):
        # image based test, no values
        test_list = {
            'tsla2021.14.jpg': {},
            'tsla2021.36.jpg': {},
            'tsla2021.123.jpg': {},
            'de2021.64.jpg': {},
            'x2021.87.jpg': {},
            'cargill2022.73.jpg': {},
            'cargill2022.83.jpg': {},
        }
        self.result_cache['tablevspan_find_intersections_find_cells'] = {}
        for fn in test_list:
            helper.reset_color_cycle()
            (target_scale, im_bin_clear, im_bin_blurred, test_img) = self._get_image(fn)
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
                    (table_scope, table_rows, table_cols) = self.result_cache['tablevspan_build_table'][fn][col_idx][row_grp_idx]
                    (intersections, intersections_upward, intersections_downward) = pseg.tablevspan.find_intersections(column, rows, table_cols, table_rows)
                    cells = pseg.tablevspan.find_cells(intersections, intersections_upward, intersections_downward)
                    fresult[col_idx][row_grp_idx] = (intersections, intersections_upward, intersections_downward, cells)
            pseg.debug_painter.tablevspan_find_intersections_find_cells(test_img, (columns, column_row_groups, column_row_grp_row_spacings, fresult))
            self.result_cache['tablevspan_find_intersections_find_cells'][fn] = fresult
            skimage.io.imsave(ofn, test_img)
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img), msg="mismatched image: {}".format(ref_fn))
            os.remove(ofn)
