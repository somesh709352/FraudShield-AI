from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    app_name: str = "FraudShield AI"
    app_version: str = "1.0.0"
    debug: bool = True
    
    database_url: str = "sqlite:///./fraudshield.db"
    
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    graph_min_transactions: int = 5
    graph_suspicious_threshold: float = 0.7
    
    stats_zscore_threshold: float = 3.0
    stats_iqr_multiplier: float = 1.5
    
    bayesian_prior_fraud: float = 0.01
    
    optimization_cost_fn: float = 10000.0
    optimization_cost_fp: float = 100.0
    
    quantum_shots: int = 1024
    quantum_max_iterations: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()