
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


def get_color_cycle_rgb(index=None):
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

def reset_color_cycle():
    global COLOR_IDX
    COLOR_IDX = 0
