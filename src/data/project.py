import os

PROJECT_BASE_PATH = '/data/projects'


def get_path_for(project_name):
    return os.path.join(PROJECT_BASE_PATH, project_name)
