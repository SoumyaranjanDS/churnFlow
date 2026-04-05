from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    normalized = value.strip().lower()
    return normalized in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class MlApiSettings:
    app_env: str
    require_reload_api_key: bool
    reload_api_key: str


@lru_cache(maxsize=1)
def get_settings() -> MlApiSettings:
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    default_reload_required = app_env in {"production", "staging"}
    require_reload_api_key = _parse_bool(
        os.getenv("ML_API_REQUIRE_RELOAD_API_KEY"),
        default_reload_required,
    )
    reload_api_key = os.getenv("ML_API_RELOAD_API_KEY", "").strip()

    return MlApiSettings(
        app_env=app_env,
        require_reload_api_key=require_reload_api_key,
        reload_api_key=reload_api_key,
    )
