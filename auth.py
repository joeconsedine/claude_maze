from functools import wraps
from flask import session, request, jsonify, redirect, url_for, g, current_app
from models import User, UserSession, db
import logging

logger = logging.getLogger(__name__)

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not g.user:
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not g.user:
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))

        if not g.user.is_admin():
            if request.is_json:
                return jsonify({'error': 'Admin access required'}), 403
            return redirect(url_for('index'))

        return f(*args, **kwargs)
    return decorated_function

def standard_or_admin_required(f):
    """Decorator to require standard or admin role (any authenticated user)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not g.user:
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def load_user_from_session():
    """Load user from session token"""
    session_token = session.get('session_token')
    if not session_token:
        return None

    try:
        user_session = UserSession.query.filter_by(
            session_token=session_token,
            is_active=True
        ).first()

        if not user_session or not user_session.is_valid():
            if user_session:
                # Session expired, clean it up
                user_session.invalidate()
                db.session.commit()
            session.clear()
            return None

        return user_session.user

    except Exception as e:
        logger.error(f"Error loading user from session: {e}")
        session.clear()
        return None

def create_user_session(user, ip_address=None, user_agent=None):
    """Create a new session for user and handle seat management"""
    try:
        # For standard users, increment seat count
        if user.is_standard():
            if not user.organization.increment_seat():
                return None, "No available seats in organization"

        # Create session
        user_session = UserSession.create_session(
            user.id,
            hours=24,
            ip_address=ip_address,
            user_agent=user_agent
        )

        db.session.add(user_session)

        # Update last login
        from datetime import datetime
        user.last_login = datetime.utcnow()

        db.session.commit()

        # Store session token
        session['session_token'] = user_session.session_token
        session['user_id'] = user.id
        session.permanent = True

        logger.info(f"Session created for user {user.username} (Role: {user.role})")
        return user_session, "Session created successfully"

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating session: {e}")
        return None, "Failed to create session"

def destroy_user_session():
    """Destroy current user session and handle seat management"""
    session_token = session.get('session_token')
    if not session_token:
        return

    try:
        user_session = UserSession.query.filter_by(
            session_token=session_token,
            is_active=True
        ).first()

        if user_session:
            user = user_session.user

            # For standard users, decrement seat count
            if user.is_standard():
                user.organization.decrement_seat()

            # Invalidate session
            user_session.invalidate()
            db.session.commit()

            logger.info(f"Session destroyed for user {user.username}")

    except Exception as e:
        logger.error(f"Error destroying session: {e}")
        db.session.rollback()

    finally:
        session.clear()

def cleanup_expired_sessions():
    """Clean up expired sessions and adjust seat counts"""
    try:
        # Get expired sessions that are still active
        from datetime import datetime
        expired_sessions = UserSession.query.filter(
            UserSession.expires_at < datetime.utcnow(),
            UserSession.is_active == True
        ).all()

        for user_session in expired_sessions:
            user = user_session.user

            # For standard users, decrement seat count
            if user and user.is_standard():
                user.organization.decrement_seat()

            # Remove expired session
            db.session.delete(user_session)

        db.session.commit()
        logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")

    except Exception as e:
        logger.error(f"Error cleaning up expired sessions: {e}")
        db.session.rollback()

def init_auth(app):
    """Initialize authentication system"""

    @app.before_request
    def load_logged_in_user():
        """Load user before each request"""
        g.user = load_user_from_session()

    @app.context_processor
    def inject_user():
        """Make user available in templates"""
        return {'current_user': g.user}

    # Set session configuration
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

    # Cleanup expired sessions periodically (you might want to run this as a background task)
    import atexit
    atexit.register(cleanup_expired_sessions)