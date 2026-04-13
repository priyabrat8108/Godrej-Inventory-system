import uuid
from django.db import models
from django.core.exceptions import ValidationError


# ==============================
# ENUMS
# ==============================

class MaintenanceCategory(models.TextChoices):
    SPARE_PART = "SPARE_PART", "Spare Part"
    CONSUMABLE = "CONSUMABLE", "Consumable"
    TOOL = "TOOL", "Tool"
    OTHER = "OTHER", "Other"


class TransactionType(models.TextChoices):
    PURCHASE = "PURCHASE", "Purchase"
    USAGE = "USAGE", "Usage"


class ApprovalStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


# ==============================
# VENDOR
# ==============================

class Vendor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255, unique=True)
    contact_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ==============================
# ITEM
# ==============================

class Item(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    item_code = models.CharField(max_length=100, unique=True)
    description = models.TextField()

    machine_name = models.CharField(max_length=100)

    cupboard_no = models.CharField(max_length=100, blank=True, null=True)
    rack_no = models.CharField(max_length=100, blank=True, null=True)

    material_type = models.CharField(max_length=150, default="GENERAL")


    quantity = models.IntegerField(default=0)
    min_quantity = models.IntegerField(default=0)

    maintenance_category = models.CharField(
        max_length=20,
        choices=MaintenanceCategory.choices,
        default=MaintenanceCategory.OTHER
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name="items",
        null=True,
        blank=True
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.quantity < 0:
            raise ValidationError("Quantity cannot be negative.")
        if self.min_quantity < 0:
            raise ValidationError("Minimum quantity cannot be negative.")

    @property
    def stock_status(self):
        if self.quantity == 0:
            return "OUT_OF_STOCK"
        elif self.quantity <= self.min_quantity:
            return "LOW_STOCK"
        return "NORMAL"

    def __str__(self):
        return f"{self.item_code} - {self.description}"


# ==============================
# INVENTORY TRANSACTION
# ==============================

class InventoryTransaction(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="transactions"
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices
    )

    quantity = models.IntegerField()

    # 🔹 SYSTEM LOGIN USER
    performed_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="performed_transactions"
    )

    # 🔹 ACTUAL PHYSICAL OPERATOR (NEW FIELD)
    operator_name = models.CharField(
        max_length=150,
        null=True,
        blank=True
    )

    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.APPROVED
    )

    approved_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_transactions"
    )

    purpose = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item.item_code} - {self.transaction_type}"


from django.db import models


class Notification(models.Model):

    recipient_role = models.CharField(max_length=50)
    type = models.CharField(max_length=50, blank=True, null=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient_role} - {self.type}"

import uuid
from django.db import models


class InventoryItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    item_code = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField()
    machine_name = models.CharField(max_length=150, db_index=True)

    cupboard_no = models.CharField(max_length=50, db_index=True)
    rack_no = models.CharField(max_length=50, blank=True, null=True)

    quantity = models.IntegerField()
    min_quantity = models.IntegerField()

    vendor_name = models.CharField(max_length=255, db_index=True)
    vendor_contact = models.CharField(max_length=20, blank=True)
    vendor_email = models.EmailField(blank=True)
    vendor_address = models.TextField(blank=True)

    maintenance_category = models.CharField(max_length=100, blank=True, null=True)
    material_type = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["item_code"]),
            models.Index(fields=["machine_name"]),
            models.Index(fields=["vendor_name"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.item_code