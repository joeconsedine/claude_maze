from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets

db = SQLAlchemy()

class Organization(db.Model):
    __tablename__ = 'organizations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    seat_limit = db.Column(db.Integer, nullable=False, default=5)
    current_seats = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    users = db.relationship('User', backref='organization', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Organization {self.name}>'

    def can_add_seat(self):
        """Check if organization can add another seat"""
        return self.current_seats < self.seat_limit

    def increment_seat(self):
        """Increment current seats if possible"""
        if self.can_add_seat():
            self.current_seats += 1
            return True
        return False

    def decrement_seat(self):
        """Decrement current seats"""
        if self.current_seats > 0:
            self.current_seats -= 1

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='standard')  # 'admin' or 'standard'
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationship
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        """Check if user has admin role"""
        return self.role == 'admin'

    def is_standard(self):
        """Check if user has standard role"""
        return self.role == 'standard'

    def can_login(self):
        """Check if user can login based on seat limits"""
        if not self.is_active:
            return False, "Account is inactive"

        # Admins bypass seat limits
        if self.is_admin():
            return True, "Admin access granted"

        # Check seat availability for standard users
        if self.organization.can_add_seat():
            return True, "Seat available"
        else:
            return False, "No available seats in organization"

class UserSession(db.Model):
    __tablename__ = 'user_sessions'

    id = db.Column(db.Integer, primary_key=True)
    session_token = db.Column(db.String(64), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    ip_address = db.Column(db.String(45))  # Support IPv6
    user_agent = db.Column(db.Text)

    def __repr__(self):
        return f'<UserSession {self.session_token[:8]}...>'

    @staticmethod
    def generate_token():
        """Generate a secure session token"""
        return secrets.token_urlsafe(32)

    def is_expired(self):
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at

    def is_valid(self):
        """Check if session is valid (active and not expired)"""
        return self.is_active and not self.is_expired()

    @classmethod
    def create_session(cls, user_id, hours=24, ip_address=None, user_agent=None):
        """Create a new session for user"""
        session = cls(
            session_token=cls.generate_token(),
            user_id=user_id,
            expires_at=datetime.utcnow() + timedelta(hours=hours),
            ip_address=ip_address,
            user_agent=user_agent
        )
        return session

    def invalidate(self):
        """Invalidate this session"""
        self.is_active = False

    @classmethod
    def cleanup_expired(cls):
        """Remove expired sessions"""
        expired_sessions = cls.query.filter(cls.expires_at < datetime.utcnow()).all()
        for session in expired_sessions:
            db.session.delete(session)
        return len(expired_sessions)