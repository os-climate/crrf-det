import urllib.parse


def fix_folder(folder):
    if folder is None:
        return None
    if len(folder) == 0:
        return None
    return urllib.parse.unquote(folder)
