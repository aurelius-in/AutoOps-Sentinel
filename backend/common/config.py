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
            "postgresql+psycopg2://autoops:autoops@localhost:5432/autoops",
        )
    )

    # Agent / LLM
    openai_api_key: str | None = Field(default=os.getenv("OPENAI_API_KEY"))
    model_name: str = Field(default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))

    # Detector
    detector_interval_seconds: int = Field(default=10)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


