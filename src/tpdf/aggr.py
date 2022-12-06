"""
'aggr' or 'aggregator' module combines the page image segmentation results
from 'pseg' and text retrieved from 'docmt' to build final structured
document.

"""

from . import pseg


def collect_tables(pseg_results, page_content):
    """
    `collect_tables` combines the "cells" results from page segmentation
    with per-word coordinates in page_content to build final csv-like
    table rows.

    """
    columns = pseg_results['columns']
    spacings = pseg_results['spacings']
    column_row_groups = pseg_results['column_row_groups']
    column_row_grp_build_table = pseg_results.get('column_row_grp_build_table', {})
    column_row_grp_cells = pseg_results.get('column_row_grp_cells', {})

    tables = []

    # loop through all columns
    for col_idx, row_grp_build_table in column_row_grp_build_table.items():
        column = columns[col_idx]
        # loop through all row groups
        for row_grp_idx, (table_scope, table_rows, table_cols) in row_grp_build_table.items():
            if (not table_rows and
                not table_cols):
                continue

            rows = column_row_groups[col_idx][row_grp_idx]

            # determine row/col shift of the cells coordinates (which is
            # originally relative to a row group), relative to the
            # top-left of the whole (sized-down) image
            inters_img_col_shift = int(column[0])
            inters_img_row_shift = int(rows[0][0])

            # recalculate cells relative to whole image top-left
            (intersections, ntsuw, ntsdw, cells) = column_row_grp_cells[col_idx][row_grp_idx]
            cells = [(y0 + inters_img_row_shift, x0 + inters_img_col_shift, y1 + inters_img_row_shift, x1 + inters_img_col_shift) for (y0, x0, y1, x1) in cells]

            # recalculate per-word coordinates so that it matches
            # cells coordinate "narrow side 400px" proportions
            target_scale = pseg.calc_target_scale(page_content['page']['width'], page_content['page']['height'])
            words = []
            for w in page_content['words']:
                for key in w:
                    if key == 'text':
                        continue
                    w[key] /= target_scale
                # precalculate half a word area/size as the "coverage
                # threshold" for cell inclusion requirement, in other
                # words, half the word must be in the cell
                w['coverage_threshold'] = 0.5 * (w['xmax'] - w['xmin']) * (w['ymax'] - w['ymin'])
                words.append(w)

            taken_cells = []
            # loop through predicted tables
            for (row_top_idx, row_bottom_idx) in table_scope:
                # extract the relevant cells for this particlar table
                # (with `table_scope` determining the top/bottom rows)
                if row_top_idx > 0:
                    table_row_top = int((rows[row_top_idx][0] + rows[row_top_idx - 1][1]) / 2)
                else:
                    table_row_top = rows[row_top_idx][0]
                if row_bottom_idx == len(rows) - 1:
                    table_row_bottom = rows[row_bottom_idx][1]
                else:
                    table_row_bottom = int((rows[row_bottom_idx][1] + rows[row_bottom_idx + 1][0]) / 2)
                table_cells = [(y0, x0, y1, x1) for (y0, x0, y1, x1) in cells if (y1 <= table_row_bottom and y0 >= table_row_top)]
                taken_cells += table_cells

                # list and sort top (row_starts), left (col_starts) sides
                # of all cells, which determines the total columns and
                # rows for the table
                cell_col_starts = list(sorted(set([x0 for (y0, x0, y1, x1) in table_cells])))
                cell_row_starts = list(sorted(set([y0 for (y0, x0, y1, x1) in table_cells])))

                # the 2d list for the table
                table = [[''] * len(cell_col_starts) for i in range(0, len(cell_row_starts))]
                # used_word_indices is a mechanism to prevent a single word
                # to be used more than one time, due to duplicate cells
                used_word_indices = set()
                # loop for the rows
                for tr_idx, tr_start in enumerate(cell_row_starts):
                    # enumerate and loop all cells for the row
                    row_cells = [(y0, x0, y1, x1) for (y0, x0, y1, x1) in table_cells if y0 == tr_start]
                    for row_cell in row_cells:
                        # determine column index
                        tc_idx = cell_col_starts.index(row_cell[1])
                        cell_word = []
                        # list all the words
                        for w_idx, w in enumerate(words):
                            if w_idx in used_word_indices:
                                continue
                            # calculate overlap, and see if the word is
                            # inside the cell (according to the
                            # predefined threshold)
                            x_overlap = max(0, min(row_cell[3], w['xmax']) - max(row_cell[1], w['xmin']))
                            y_overlap = max(0, min(row_cell[2], w['ymax']) - max(row_cell[0], w['ymin']))
                            if x_overlap * y_overlap > w['coverage_threshold']:
                                used_word_indices.add(w_idx)
                                cell_word.append(w['text'])
                        if cell_word:
                            table[tr_idx][tc_idx] = ' '.join(cell_word)
                if table:
                    tables.append({
                        'content': table
                    })
    return tables
