#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestio V4 - Launcher (point d'entree)
"""

import sys
import multiprocessing

import launcher_core
import launcher_ui


def main() -> None:
    multiprocessing.freeze_support()
    app_dir = launcher_core.resolve_app_dir()
    uv_path = launcher_core.resolve_uv_path()
    launcher_ui.Launcher(app_dir, uv_path).run()


if __name__ == "__main__":
    main()
