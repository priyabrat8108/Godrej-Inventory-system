from rest_framework import serializers 
from .models import Item, Vendor

from rest_framework import serializers
from .models import Item, Vendor


# ===============================
# VENDOR SERIALIZER (FIRST)
# ===============================

class VendorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "contact_number",
            "email",
            "address",
            "is_active"
        ]


# ===============================
# ITEM SERIALIZER (SECOND)
# ===============================

class ItemSerializer(serializers.ModelSerializer):

    vendor = VendorSerializer(read_only=True)

    stock_status = serializers.SerializerMethodField()
    stock_level = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            "id",
            "item_code",
            "description",
            "machine_name",
            "cupboard_no",
            "rack_no",
            "quantity",
            "min_quantity",
            "maintenance_category",
            "material_type",
            "vendor",
            "is_active",
            "created_at",
            "stock_status",
            "stock_level"
        ]


    # ===============================
    # FIELD VALIDATION
    # ===============================

    def validate_item_code(self, value):
        if self.instance:
            if Item.objects.exclude(pk=self.instance.pk).filter(item_code=value).exists():
                raise serializers.ValidationError("Item code already exists.")
        else:
            if Item.objects.filter(item_code=value).exists():
                raise serializers.ValidationError("Item code already exists.")
        return value

    def validate(self, data):

        quantity = data.get("quantity", getattr(self.instance, "quantity", 0))
        min_quantity = data.get("min_quantity", getattr(self.instance, "min_quantity", 0))

        if quantity < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")

        if min_quantity < 0:
            raise serializers.ValidationError("Minimum quantity cannot be negative.")

        # Only require maintenance_category on CREATE
        if not self.instance:
            if not data.get("maintenance_category"):
                raise serializers.ValidationError("Maintenance category is required.")

        return data

    # ===============================
    # STOCK STATUS
    # ===============================

    def get_stock_status(self, obj):
        if obj.quantity <= 0:
            return "OUT_OF_STOCK"
        elif obj.quantity <= obj.min_quantity:
            return "LOW_STOCK"
        return "IN_STOCK"

    # ===============================
    # STOCK LEVEL %
    # ===============================

    def get_stock_level(self, obj):
        if obj.min_quantity == 0:
            return 100
        return round((obj.quantity / obj.min_quantity) * 100, 2)

    # ===============================
    # CREATE ITEM WITH VENDOR
    # ===============================

    def create(self, validated_data):
     return Item.objects.create(**validated_data)

from rest_framework import serializers
from .models import InventoryItem


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"