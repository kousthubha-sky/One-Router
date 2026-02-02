"""
Database Model Mixins
Reusable patterns for database models.
"""

from sqlalchemy import Column, DateTime, Boolean, event
from sqlalchemy.orm import declared_attr
from datetime import datetime


class SoftDeleteMixin:
    """
    Mixin that adds soft delete functionality to models.

    Instead of permanently deleting records, this marks them as deleted
    while preserving the data for audit/compliance purposes.

    Usage:
        class MyModel(Base, SoftDeleteMixin):
            __tablename__ = "my_table"
            ...

        # Soft delete
        record.soft_delete()

        # Query only active records
        query = select(MyModel).where(MyModel.is_deleted == False)

        # Query including deleted
        query = select(MyModel)  # includes deleted

        # Restore
        record.restore()
    """

    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(DateTime, nullable=True)  # User ID who deleted

    def soft_delete(self, deleted_by: str = None):
        """Mark record as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        if deleted_by:
            self.deleted_by = deleted_by

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None

    @classmethod
    def active_only(cls):
        """Returns a filter for non-deleted records."""
        return cls.is_deleted == False


class TimestampMixin:
    """
    Mixin that adds created_at and updated_at timestamps.

    Usage:
        class MyModel(Base, TimestampMixin):
            __tablename__ = "my_table"
            ...
    """

    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)

    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
            nullable=False
        )


class AuditMixin(TimestampMixin, SoftDeleteMixin):
    """
    Combined mixin with timestamps and soft delete.

    Usage:
        class MyModel(Base, AuditMixin):
            __tablename__ = "my_table"
            ...
    """
    pass
