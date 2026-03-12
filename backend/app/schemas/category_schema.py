"""
Category schemas for serialization and validation.
"""

from marshmallow import Schema, ValidationError, fields, post_load, pre_load, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from app.models.category import Category
from app.utils.constants import CategoryType
from app.utils.validators import validate_hex_color


class CategorySchema(SQLAlchemyAutoSchema):
    """Schema for category serialization."""

    class Meta:
        model = Category
        load_instance = True
        include_fk = True

    id = fields.Integer(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    type = fields.String(required=True, validate=validate.OneOf(CategoryType.choices()))
    color = fields.String(
        validate=validate.Length(min=4, max=7), load_default="#808080"
    )
    icon = fields.String(allow_none=True, validate=validate.Length(max=50))
    description = fields.String(allow_none=True, validate=validate.Length(max=200))
    parent_id = fields.Integer(allow_none=True)
    user_id = fields.Integer(dump_only=True)
    is_system = fields.Boolean(dump_only=True)
    is_active = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")
    updated_at = fields.DateTime(dump_only=True, format="%Y-%m-%d %H:%M:%S")

    # Computed fields
    full_path = fields.String(dump_only=True)
    transaction_count = fields.Integer(dump_only=True)
    total_amount = fields.Float(dump_only=True)

    @pre_load
    def validate_color(self, data, **kwargs):
        """Validate hex color."""
        if "color" in data and data["color"]:
            error = validate_hex_color(data["color"])
            if error:
                raise ValidationError(error, "color")
        return data


class CategoryCreateSchema(Schema):
    """Schema for category creation."""

    name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    type = fields.String(required=True, validate=validate.OneOf(CategoryType.choices()))
    color = fields.String(
        validate=validate.Length(min=4, max=7),
        load_default="#808080",  # ✅ Changed from missing="#808080"
    )
    icon = fields.String(allow_none=True, validate=validate.Length(max=50))
    description = fields.String(allow_none=True, validate=validate.Length(max=200))
    parent_id = fields.Integer(allow_none=True)

    @pre_load
    def validate_color(self, data, **kwargs):
        """Validate hex color."""
        if "color" in data and data["color"]:
            error = validate_hex_color(data["color"])
            if error:
                raise ValidationError(error, "color")
        return data

    @post_load
    def validate_parent(self, data, **kwargs):
        """Validate parent category."""
        if data.get("parent_id"):
            parent = Category.query.get(data["parent_id"])
            if not parent:
                raise ValidationError("Parent category not found", "parent_id")

            # Check type match
            if parent.type != data.get("type", parent.type):
                raise ValidationError(
                    f"Parent category type must be '{data.get('type', parent.type)}'",
                    "type",
                )

        return data

    @post_load
    def validate_name(self, data, **kwargs):
        """Validate category name."""
        # Additional name validation if needed
        if len(data["name"]) < 1:
            raise ValidationError("Category name cannot be empty", "name")
        return data


class CategoryUpdateSchema(Schema):
    """Schema for category updates."""

    name = fields.String(validate=validate.Length(min=1, max=50))
    color = fields.String(validate=validate.Length(min=4, max=7))
    icon = fields.String(allow_none=True, validate=validate.Length(max=50))
    description = fields.String(allow_none=True, validate=validate.Length(max=200))
    is_active = fields.Boolean()

    @pre_load
    def validate_color(self, data, **kwargs):
        """Validate hex color."""
        if "color" in data and data["color"]:
            error = validate_hex_color(data["color"])
            if error:
                raise ValidationError(error, "color")
        return data

    @post_load
    def validate_at_least_one(self, data, **kwargs):
        """Ensure at least one field is provided."""
        if not data:
            raise ValidationError("At least one field must be provided")
        return data


class CategoryFilterSchema(Schema):
    """Schema for category filters."""

    type = fields.String(validate=validate.OneOf(CategoryType.choices()))
    include_system = fields.Boolean(load_default=True)
    include_inactive = fields.Boolean(load_default=False)
    parent_id = fields.Integer(allow_none=True)
    search = fields.String(allow_none=True)


class CategoryHierarchySchema(Schema):
    """Schema for category hierarchy."""

    id = fields.Integer()
    name = fields.String()
    type = fields.String()
    color = fields.String()
    icon = fields.String()
    transaction_count = fields.Integer()
    children = fields.List(fields.Nested(lambda: CategoryHierarchySchema()))

    class Meta:
        ordered = True


class CategoryStatsSchema(Schema):
    """Schema for category statistics."""

    category_id = fields.Integer()
    category_name = fields.String()
    category_color = fields.String()
    transaction_count = fields.Integer()
    total_amount = fields.Float()
    average_amount = fields.Float()
    percentage = fields.Float()
