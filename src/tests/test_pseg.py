import os
import numpy
import skimage
import unittest

from tpdf import pseg


class TestPSeg(unittest.TestCase):

    def setUp(self):
        self.t_columns_from_image = {
            'tsla2021.2.jpg': ([[24, 143], [180, 407], [433, 660]], [[0, 24], [143, 180], [407, 433], [660, 710]]),
            'tsla2021.14.jpg': ([[24, 226], [259, 675]], [[0, 24], [226, 259], [675, 710]]),
            'tsla2021.36.jpg': ([[25, 691]], [[0, 25], [691, 710]]),
            'tsla2021.123.jpg': ([[24, 687]], [[0, 24], [687, 710]]),
            'de2021.63.jpg': ([[39, 346], [388, 396]], [[0, 39], [346, 388]]),
            'x2021.27.jpg': ([[250, 299], [362, 517], [536, 550], [580, 689]], [[0, 250], [299, 362], [517, 536], [550, 580], [689, 710]]),
            'x2021.87.jpg': ([[22, 229], [268, 689]], [[0, 22], [229, 268], [689, 710]])
        }
        self.image_cache = {}
        self.basepath = os.path.dirname(__file__)
        all_images = [self.t_columns_from_image]
        all_images = set().union(*all_images)
        for fn in all_images:
            fnp = os.path.join(self.basepath, 'src_imgs', fn)
            img = skimage.io.imread(fnp)
            (target_scale, im_bin_clear, im_bin_blurred) = pseg.prepare_images_for_segmentation(img)
            self.image_cache[fn] = (target_scale, im_bin_clear, im_bin_blurred)

    def tearDown(self):
        pass

    def test_columns_from_image(self):
        for fn, (r_columns, r_spacings) in self.t_columns_from_image.items():
            (target_scale, im_bin_clear, im_bin_blurred) = self.image_cache[fn]
            (columns, spacings) = pseg.columns_from_image(im_bin_clear)
            test_img = skimage.color.gray2rgb(im_bin_clear)
            for column in columns:
                rr, cc = skimage.draw.rectangle((0, column[0]), (im_bin_clear.shape[0], column[1]))
                skimage.draw.set_color(test_img, (rr, cc), (255, 255, 0), 0.5)
            for spacing in spacings:
                rr, cc = skimage.draw.rectangle((0, spacing[0]), (im_bin_clear.shape[0], spacing[1]))
                skimage.draw.set_color(test_img, (rr, cc), (0, 255, 0), 0.5)
            ofn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_columns_from_image.test.png')
            skimage.io.imsave(ofn, test_img)
            self.assertEqual(r_columns, columns)
            self.assertEqual(r_spacings, spacings)
            ref_fn = os.path.join(self.basepath, 'ref_imgs', fn[:-4] + '_columns_from_image.png')
            ref_img = skimage.io.imread(ref_fn)
            self.assertTrue(numpy.alltrue(test_img == ref_img))
