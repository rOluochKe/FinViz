"""
Webhook routes for external integrations with Flask-RESTX.
"""

import hashlib
import hmac
from datetime import datetime

from flask import Blueprint, current_app, request
from flask_restx import Namespace, Resource, fields

from app.extensions import db
from app.models.category import Category
from app.models.transaction import Transaction
from app.utils.constants import HTTP_STATUS

# Create a blueprint for webhooks (these will be public endpoints)
webhooks_bp = Blueprint("webhooks", __name__, url_prefix="/webhooks")

# Create namespace for Swagger documentation (for reference)
webhooks_ns = Namespace(
    "webhooks", description="Webhook endpoints for external integrations"
)

# ============================================================================
# Helper Functions
# ============================================================================


def verify_signature(payload, signature, secret):
    """Verify webhook signature."""
    expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


# ============================================================================
# Model Definitions (for Swagger documentation)
# ============================================================================

webhook_response = webhooks_ns.model(
    "WebhookResponse",
    {"status": fields.String(description="Webhook status", example="received")},
)

error_response = webhooks_ns.model(
    "ErrorResponse", {"error": fields.String(description="Error message")}
)

# Plaid webhook models
plaid_webhook_model = webhooks_ns.model(
    "PlaidWebhook",
    {
        "webhook_type": fields.String(
            description="Webhook type", example="TRANSACTIONS"
        ),
        "webhook_code": fields.String(
            description="Webhook code", example="TRANSACTIONS_UPDATED"
        ),
        "item_id": fields.String(description="Item ID", example="item_123"),
        "error": fields.Raw(description="Error details", allow_null=True),
    },
)

# Stripe webhook models
stripe_webhook_model = webhooks_ns.model(
    "StripeWebhook",
    {
        "id": fields.String(description="Event ID", example="evt_123"),
        "type": fields.String(
            description="Event type", example="invoice.payment_succeeded"
        ),
        "data": fields.Raw(description="Event data"),
        "created": fields.Integer(description="Creation timestamp"),
        "livemode": fields.Boolean(description="Live mode flag"),
        "pending_webhooks": fields.Integer(description="Pending webhooks count"),
    },
)

# GitHub webhook models
github_webhook_model = webhooks_ns.model(
    "GitHubWebhook",
    {
        "ref": fields.String(description="Git reference", example="refs/heads/main"),
        "before": fields.String(description="Previous commit SHA"),
        "after": fields.String(description="New commit SHA"),
        "repository": fields.Raw(description="Repository information"),
        "pusher": fields.Raw(description="Pusher information"),
        "commits": fields.List(fields.Raw, description="List of commits"),
    },
)

# SendGrid webhook models
sendgrid_event_model = webhooks_ns.model(
    "SendGridEvent",
    {
        "email": fields.String(
            description="Recipient email", example="user@example.com"
        ),
        "event": fields.String(
            description="Event type",
            example="open",
            enum=["open", "click", "bounce", "delivered", "dropped", "spamreport"],
        ),
        "timestamp": fields.Integer(description="Event timestamp"),
        "sg_event_id": fields.String(description="SendGrid event ID"),
        "sg_message_id": fields.String(description="SendGrid message ID"),
        "category": fields.String(description="Event category"),
        "useragent": fields.String(description="User agent"),
        "ip": fields.String(description="IP address"),
    },
)

sendgrid_webhook_model = webhooks_ns.model(
    "SendGridWebhook", {"events": fields.List(fields.Nested(sendgrid_event_model))}
)

# ============================================================================
# Webhook Endpoints (using Blueprint, not Namespace)
# These are public endpoints that external services call
# ============================================================================


@webhooks_bp.route("/plaid", methods=["POST"])
def plaid_webhook():
    """Handle Plaid webhook."""
    payload = request.get_data()
    signature = request.headers.get("Plaid-Verification", "")

    # Verify signature (in production)
    # if not verify_signature(payload, signature, current_app.config['PLAID_WEBHOOK_SECRET']):
    #     return jsonify(error="Invalid signature"), HTTP_STATUS.UNAUTHORIZED

    data = request.get_json()
    webhook_type = data.get("webhook_type")
    webhook_code = data.get("webhook_code")

    current_app.logger.info(f"Plaid webhook: {webhook_type} - {webhook_code}")

    # Handle different webhook types
    if webhook_code == "TRANSACTIONS_UPDATED":
        current_app.logger.info("Transactions updated, sync needed")
        # Trigger transaction sync here
        # This could be a background task or API call
        pass

    return {"status": "received"}, HTTP_STATUS.OK


@webhooks_bp.route("/stripe", methods=["POST"])
def stripe_webhook():
    """Handle Stripe webhook."""
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature")

    # Verify signature (in production)
    # try:
    #     import stripe
    #     event = stripe.Webhook.construct_event(
    #         payload, sig_header, current_app.config['STRIPE_WEBHOOK_SECRET']
    #     )
    # except ValueError:
    #     return {"error": "Invalid payload"}, HTTP_STATUS.BAD_REQUEST
    # except stripe.error.SignatureVerificationError:
    #     return {"error": "Invalid signature"}, HTTP_STATUS.UNAUTHORIZED

    data = request.get_json()
    event_type = data.get("type")

    current_app.logger.info(f"Stripe webhook: {event_type}")

    # Handle different event types
    if event_type == "invoice.payment_succeeded":
        current_app.logger.info("Payment succeeded, update subscription")
        # Update user subscription
        pass
    elif event_type == "customer.subscription.deleted":
        current_app.logger.info("Subscription cancelled")
        # Handle subscription cancellation
        pass

    return {"status": "received"}, HTTP_STATUS.OK


@webhooks_bp.route("/github", methods=["POST"])
def github_webhook():
    """Handle GitHub webhook for CI/CD."""
    payload = request.get_data()
    signature = request.headers.get("X-Hub-Signature-256", "")

    # Verify signature
    # if not verify_signature(payload, signature, current_app.config['GITHUB_WEBHOOK_SECRET']):
    #     return {"error": "Invalid signature"}, HTTP_STATUS.UNAUTHORIZED

    data = request.get_json()
    event = request.headers.get("X-GitHub-Event", "ping")

    if event == "push":
        branch = data.get("ref", "").replace("refs/heads/", "")
        current_app.logger.info(f"Push to {branch}")

        # Trigger deployment
        if branch == "main" or branch == "master":
            current_app.logger.info("Triggering production deployment")
            # Run deployment script
            # This could be a subprocess call, API request, or message queue
            pass

    elif event == "pull_request":
        action = data.get("action")
        pr_number = data.get("number")
        current_app.logger.info(f"Pull request {action}: #{pr_number}")
        # Run CI checks
        pass

    return {"status": "received"}, HTTP_STATUS.OK


@webhooks_bp.route("/sendgrid", methods=["POST"])
def sendgrid_webhook():
    """Handle SendGrid event webhook."""
    data = request.get_json()

    if not isinstance(data, list):
        data = [data]

    for event in data:
        email = event.get("email")
        event_type = event.get("event")
        timestamp = event.get("timestamp")
        sg_event_id = event.get("sg_event_id")

        current_app.logger.info(
            f"SendGrid event: {event_type} for {email} (ID: {sg_event_id})"
        )

        # Update email status in database
        if event_type == "bounce":
            # Mark email as bounced
            # user = User.query.filter_by(email=email).first()
            # if user:
            #     user.email_bounced = True
            #     db.session.commit()
            pass
        elif event_type == "open":
            # Track email open
            # This could update a last_opened timestamp
            pass
        elif event_type == "click":
            # Track link click
            pass
        elif event_type == "dropped":
            # Handle dropped email
            pass
        elif event_type == "spamreport":
            # Handle spam report
            pass

    return {"status": "received"}, HTTP_STATUS.OK


@webhooks_bp.route("/generic", methods=["POST"])
def generic_webhook():
    """Generic webhook endpoint for testing."""
    data = request.get_json()
    headers = dict(request.headers)

    current_app.logger.info(f"Generic webhook received")
    current_app.logger.debug(f"Headers: {headers}")
    current_app.logger.debug(f"Body: {data}")

    return {
        "status": "received",
        "timestamp": datetime.utcnow().isoformat(),
        "headers_received": list(headers.keys()),
    }, HTTP_STATUS.OK


# ============================================================================
# For Swagger documentation (these are just for reference, not actual endpoints)
# ============================================================================


@webhooks_ns.route("/plaid")
@webhooks_ns.doc(description="Plaid webhook endpoint (public)")
class PlaidWebhookDoc(Resource):
    @webhooks_ns.expect(plaid_webhook_model)
    @webhooks_ns.response(200, "Webhook received", webhook_response)
    @webhooks_ns.response(401, "Invalid signature")
    def post(self):
        """Handle Plaid webhook (documentation only)"""
        pass


@webhooks_ns.route("/stripe")
@webhooks_ns.doc(description="Stripe webhook endpoint (public)")
class StripeWebhookDoc(Resource):
    @webhooks_ns.expect(stripe_webhook_model)
    @webhooks_ns.response(200, "Webhook received", webhook_response)
    @webhooks_ns.response(400, "Invalid payload")
    @webhooks_ns.response(401, "Invalid signature")
    def post(self):
        """Handle Stripe webhook (documentation only)"""
        pass


@webhooks_ns.route("/github")
@webhooks_ns.doc(description="GitHub webhook endpoint (public)")
class GitHubWebhookDoc(Resource):
    @webhooks_ns.expect(github_webhook_model)
    @webhooks_ns.response(200, "Webhook received", webhook_response)
    @webhooks_ns.response(401, "Invalid signature")
    def post(self):
        """Handle GitHub webhook (documentation only)"""
        pass


@webhooks_ns.route("/sendgrid")
@webhooks_ns.doc(description="SendGrid event webhook endpoint (public)")
class SendGridWebhookDoc(Resource):
    @webhooks_ns.expect([sendgrid_event_model])
    @webhooks_ns.response(200, "Webhook received", webhook_response)
    def post(self):
        """Handle SendGrid webhook (documentation only)"""
        pass
