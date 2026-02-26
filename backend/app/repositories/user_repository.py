from sqlalchemy.orm import Session
from app.models.user import User

async def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

async def create_user(db: Session, email: str, full_name: str, password_hash: str) -> User:
    user = User(email=email, full_name=full_name, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
