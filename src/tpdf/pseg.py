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
