from __future__ import annotations

from fastapi import Header, HTTPException, Depends
from ..common.config import settings


async def require_admin_token(x_api_token: str | None = Header(default=None)) -> None:
    if not settings.api_token:
        return
    if x_api_token != settings.api_token:
        raise HTTPException(status_code=401, detail="Invalid API token")


def rbac_allow(role: str):
    async def _check(x_api_token: str | None = Header(default=None), x_api_role: str | None = Header(default=None)) -> None:
        # For demo: simple token-scoped roles (comma-separated). In real life, decode JWT and check claims
        if not settings.api_token:
            return
        if x_api_token != settings.api_token:
            raise HTTPException(status_code=401, detail="Invalid API token")
        # Simple role check: require requested role or admin
        if (x_api_role or "").lower() not in {role.lower(), "admin"}:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient role")
        return
    return _check


