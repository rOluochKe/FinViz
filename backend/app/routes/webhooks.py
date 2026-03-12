"""
Webhook routes for external integrations.
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import hmac
import hashlib

from app.extensions import db
from app.models.transaction import Transaction
from app.models.category import Category
from app.utils.constants import HTTP_STATUS

webhooks_bp = Blueprint('webhooks', __name__, url_prefix='/webhooks')


def verify_signature(payload, signature, secret):
    """Verify webhook signature."""
    expected = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@webhooks_bp.route('/plaid', methods=['POST'])
def plaid_webhook():
    """Handle Plaid webhook."""
    payload = request.get_data()
    signature = request.headers.get('Plaid-Verification', '')
    
    # Verify signature (in production)
    # if not verify_signature(payload, signature, current_app.config['PLAID_WEBHOOK_SECRET']):
    #     return jsonify(error="Invalid signature"), HTTP_STATUS.UNAUTHORIZED
    
    data = request.get_json()
    webhook_type = data.get('webhook_type')
    webhook_code = data.get('webhook_code')
    
    current_app.logger.info(f"Plaid webhook: {webhook_type} - {webhook_code}")
    
    # Handle different webhook types
    if webhook_code == 'TRANSACTIONS_UPDATED':
        # Trigger transaction sync
        current_app.logger.info("Transactions updated, sync needed")
        pass
    
    return jsonify(status="received"), HTTP_STATUS.OK


@webhooks_bp.route('/stripe', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook."""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    # Verify signature (in production)
    # try:
    #     event = stripe.Webhook.construct_event(
    #         payload, sig_header, current_app.config['STRIPE_WEBHOOK_SECRET']
    #     )
    # except ValueError:
    #     return jsonify(error="Invalid payload"), HTTP_STATUS.BAD_REQUEST
    # except stripe.error.SignatureVerificationError:
    #     return jsonify(error="Invalid signature"), HTTP_STATUS.UNAUTHORIZED
    
    data = request.get_json()
    event_type = data.get('type')
    
    current_app.logger.info(f"Stripe webhook: {event_type}")
    
    return jsonify(status="received"), HTTP_STATUS.OK


@webhooks_bp.route('/github', methods=['POST'])
def github_webhook():
    """Handle GitHub webhook for CI/CD."""
    payload = request.get_data()
    signature = request.headers.get('X-Hub-Signature-256', '')
    
    # Verify signature
    # if not verify_signature(payload, signature, current_app.config['GITHUB_WEBHOOK_SECRET']):
    #     return jsonify(error="Invalid signature"), HTTP_STATUS.UNAUTHORIZED
    
    data = request.get_json()
    event = request.headers.get('X-GitHub-Event', 'ping')
    
    if event == 'push':
        branch = data.get('ref', '').replace('refs/heads/', '')
        current_app.logger.info(f"Push to {branch}")
        
        # Trigger deployment
        if branch == 'main':
            current_app.logger.info("Triggering production deployment")
            # Run deployment script
    
    return jsonify(status="received"), HTTP_STATUS.OK


@webhooks_bp.route('/sendgrid', methods=['POST'])
def sendgrid_webhook():
    """Handle SendGrid event webhook."""
    data = request.get_json()
    
    for event in data:
        email = event.get('email')
        event_type = event.get('event')
        timestamp = event.get('timestamp')
        
        current_app.logger.info(f"SendGrid event: {event_type} for {email}")
        
        # Update email status in database
        if event_type == 'bounce':
            # Mark email as bounced
            pass
        elif event_type == 'open':
            # Track email open
            pass
    
    return jsonify(status="received"), HTTP_STATUS.OK