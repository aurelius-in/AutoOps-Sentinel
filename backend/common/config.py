import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    app_name: str = Field(default="AutoOps Sentinel")
    env: str = Field(default="dev")

    # Database
    database_url: str = Field(
        default=os.getenv(
            "DATABASE_URL",
            "sqlite:///autoops.db",
        )
    )
    influx_url: str | None = Field(default=os.getenv("INFLUX_URL"))
    influx_token: str | None = Field(default=os.getenv("INFLUX_TOKEN"))
    influx_org: str | None = Field(default=os.getenv("INFLUX_ORG"))
    influx_bucket: str | None = Field(default=os.getenv("INFLUX_BUCKET"))

    # Agent / LLM
    openai_api_key: str | None = Field(default=os.getenv("OPENAI_API_KEY"))
    model_name: str = Field(default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))

    # Detector
    detector_interval_seconds: int = Field(default=10)

    # Security
    api_token: str | None = Field(default=os.getenv("API_TOKEN"))

    # CORS
    cors_origins: str = Field(default=os.getenv("CORS_ORIGINS", "*"))

    def get_cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return origins if origins else ["*"]

    # Notifications
    webhook_url: str | None = Field(default=os.getenv("WEBHOOK_URL"))

    # Policy auto-apply
    auto_apply_policies: bool = Field(default=bool(int(os.getenv("AUTO_APPLY_POLICIES", "0"))))
    policy_check_interval_seconds: int = Field(default=int(os.getenv("POLICY_CHECK_INTERVAL_SECONDS", "15")))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


