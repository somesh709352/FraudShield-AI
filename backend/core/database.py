from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

from core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TransactionRecord(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    sender_account = Column(String, index=True)
    receiver_account = Column(String, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, index=True)
    transaction_type = Column(String)
    sender_upi_id = Column(String, nullable=True)
    receiver_upi_id = Column(String, nullable=True)
    metadata_json = Column("metadata", Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "transaction_id": self.transaction_id,
            "sender_account": self.sender_account,
            "receiver_account": self.receiver_account,
            "amount": self.amount,
            "timestamp": self.timestamp,
            "transaction_type": self.transaction_type,
            "sender_upi_id": self.sender_upi_id,
            "receiver_upi_id": self.receiver_upi_id,
            "metadata": json.loads(self.metadata_json) if self.metadata_json else {}
        }


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_type = Column(String, index=True)
    input_hash = Column(String, index=True)
    result_data = Column(Text)
    risk_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()