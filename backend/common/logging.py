from __future__ import annotations

import logging
import os


def configure_root_logger(level: int | str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, str(level).upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


