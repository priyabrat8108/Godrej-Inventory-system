from reporting.models import Notification
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, F, Sum
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.core.mail import send_mail
from django.conf import settings
from audit.utils import create_audit_log
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .models import Item, InventoryTransaction, TransactionType
from .serializers import ItemSerializer
from audit.utils import create_audit_log

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings




# =========================================
# Helper Functions
# =========================================

def check_approved(user):
    print("CHECK APPROVED CALLED:", user.email, user.is_approved, user.role)

    # ✅ Always allow superuser
    if user.is_superuser:
        return None

    # ✅ Always allow HIGH_AUTHORITY
    if user.role == "HIGH_AUTHORITY":
        return None

    # ✅ Always allow ADMIN
    if user.role == "ADMIN":
        return None

    # ❌ Others must be approved
    if not user.is_approved:
        print("❌ BLOCKED BY APPROVAL")
        return Response({"error": "Account not approved"}, status=403)

    return None


def check_role(user, allowed_roles):
    print("CHECK ROLE:", user.role, "Allowed:", allowed_roles)
    if user.role not in allowed_roles:
        print("❌ BLOCKED BY ROLE")
        return Response({"error": "Permission denied"}, status=403)
    return None

# =========================================
# Pagination
# =========================================

class StandardPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'per_page'


# =========================================
# GET ALL ITEMS
# =========================================

from django.db.models import Q, F
from django.utils.dateparse import parse_date


from django.db.models import Q

from math import ceil


from django.core.paginator import Paginator
from django.db.models import Q, F


from django.db.models import Q, F
from datetime import datetime


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_items(request):

    search = request.GET.get("search")
    category = request.GET.get("category")
    machine = request.GET.get("machine")
    status_filter = request.GET.get("status")
    ordering = request.GET.get("ordering")

    # 🔥 NEW DATE FILTERS
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    items = Item.objects.select_related("vendor").all()

    # ----------------------
    # SEARCH
    # ----------------------
    if search:
        items = items.filter(
            Q(item_code__icontains=search) |
            Q(description__icontains=search) |
            Q(machine_name__icontains=search)
        )

    # ----------------------
    # CATEGORY FILTER
    # ----------------------
    if category:
        items = items.filter(maintenance_category=category)

    # ----------------------
    # MACHINE FILTER
    # ----------------------
    if machine:
        items = items.filter(machine_name=machine)

    # ----------------------
    # STATUS FILTER
    # ----------------------
    if status_filter:
        if status_filter == "LOW_STOCK":
            items = items.filter(quantity__lte=F("min_quantity"), quantity__gt=0)
        elif status_filter == "OUT_OF_STOCK":
            items = items.filter(quantity=0)
        elif status_filter == "IN_STOCK":
            items = items.filter(quantity__gt=F("min_quantity"))

    # ----------------------
    # 🔥 DATE RANGE FILTER
    # ----------------------
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()

            items = items.filter(
                created_at__date__range=[start, end]
            )
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=400
            )

    # ----------------------
    # ORDERING
    # ----------------------
    if ordering:
        items = items.order_by(ordering)
    else:
        items = items.order_by("-created_at")

    # ----------------------
    # PAGINATION
    # ----------------------
    paginator = StandardPagination()
    paginated_items = paginator.paginate_queryset(items, request)

    serializer = ItemSerializer(paginated_items, many=True)

    return paginator.get_paginated_response(serializer.data)


# =========================================
# CREATE ITEM
# =========================================

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.db import transaction

from .models import Item, InventoryTransaction, Vendor
from .serializers import ItemSerializer

from audit.utils import create_audit_log
from rest_framework import status

from .models import InventoryTransaction, TransactionType

from .serializers import ItemSerializer
from audit.utils import create_audit_log


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_item(request):

    data = request.data.copy()

    # ---------------------------------------------------
    # 1️⃣ Extract Vendor Fields from Frontend
    # ---------------------------------------------------

    vendor_name = data.pop("vendor_name", None)
    vendor_contact = data.pop("vendor_contact", None)
    vendor_email = data.pop("vendor_email", None)
    vendor_address = data.pop("vendor_address", None)

    vendor = None

    if vendor_name:
        vendor, created = Vendor.objects.get_or_create(name=vendor_name)

        if vendor_contact and hasattr(vendor, "contact"):
            vendor.contact = vendor_contact

        if vendor_email and hasattr(vendor, "email"):
            vendor.email = vendor_email

        if vendor_address and hasattr(vendor, "address"):
            vendor.address = vendor_address

        vendor.save()

    # ---------------------------------------------------
    # 2️⃣ Validate Item Data
    # ---------------------------------------------------

    serializer = ItemSerializer(data=data)

    if not serializer.is_valid():
        print("SERIALIZER ERROR:", serializer.errors)
        return Response(serializer.errors, status=400)

    # ---------------------------------------------------
    # 3️⃣ Execute Full Creation in One Transaction
    # ---------------------------------------------------

    with transaction.atomic():

        item = serializer.save(vendor=vendor)

        initial_quantity = item.quantity

        # Create initial purchase transaction
        if initial_quantity > 0:
            InventoryTransaction.objects.create(
                item=item,
                transaction_type=TransactionType.PURCHASE,
                quantity=initial_quantity,
                performed_by=request.user,
                purpose="Initial Stock Entry"
            )

        # Create notification
        Notification.objects.create(
            recipient_role="HIGH_AUTHORITY",
            type="NEW_MATERIAL",
            message=f"New material {item.item_code} added with {item.quantity} units"
        )

        # Create audit log
        create_audit_log(
            user=request.user,
            action="Created Material",
            module="Inventory",
            old_value=None,
            new_value=ItemSerializer(item).data
        )

    # ---------------------------------------------------
    # 4️⃣ Return Response
    # ---------------------------------------------------

    return Response(
        {
            "message": "Material created successfully",
            "data": ItemSerializer(item).data
        },
        status=status.HTTP_201_CREATED
    )


# =========================================
# UPDATE ITEM
# =========================================

from django.shortcuts import get_object_or_404

from django.shortcuts import get_object_or_404
from django.db import transaction

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_item(request, pk):

    # 🔐 Approval check
    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    with transaction.atomic():

       item = Item.objects.select_for_update().get(pk=pk)

    old_quantity = item.quantity   # ✅ ADD THIS

    old_data = convert_uuids(ItemSerializer(item).data)

    serializer = ItemSerializer(item, data=request.data, partial=True)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    updated_item = serializer.save()

    new_quantity = updated_item.quantity   # ✅ ADD THIS
    added_quantity = new_quantity - old_quantity   # ✅ ADD THIS

    # ✅ CREATE TRANSACTION (IMPORTANT)
    if added_quantity != 0:
        InventoryTransaction.objects.create(
            item=updated_item,
            transaction_type=TransactionType.PURCHASE,  # or RESTOCK if you have
            quantity=added_quantity,
            performed_by=request.user,
            purpose=f"Stock updated: {old_quantity} → {new_quantity}"
        )

    # Recalculate stock status
    if updated_item.quantity == 0:
        stock_status = "OUT_OF_STOCK"
    elif updated_item.quantity <= updated_item.min_quantity:
        stock_status = "LOW_STOCK"
    else:
        stock_status = "NORMAL"

    # Audit Log
    create_audit_log(
        user=request.user,
        action="Updated Material",
        module="Inventory",
        old_value=old_data,
        new_value=convert_uuids(serializer.data)
    )

    return Response({
        "message": "Material updated successfully",
        "data": {
            "id": str(updated_item.id),
            "item_code": updated_item.item_code,
            "quantity": updated_item.quantity,
            "min_quantity": updated_item.min_quantity,
            "stock_status": stock_status
        }
    }, status=200)




# =========================================
# DELETE ITEM (Hard delete for now)
# =========================================


from uuid import UUID
from audit.utils import create_audit_log


def convert_uuids(obj):
    if isinstance(obj, dict):
        return {k: convert_uuids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_uuids(i) for i in obj]
    elif isinstance(obj, UUID):
        return str(obj)
    else:
        return obj


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_item(request, pk):

    # 🔐 Approval Check
    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    # 🔐 Role Check
    role_error = check_role(request.user, ['HIGH_AUTHORITY'])
    if role_error:
        return role_error

    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response(
            {"error": "Material not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # ❌ Prevent delete if stock exists
    if item.quantity > 0:
        return Response(
            {"error": "Cannot delete material with existing stock"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ❌ Prevent delete if transactions exist
    if InventoryTransaction.objects.filter(item=item).exists():
        return Response(
            {"error": "Cannot delete material with transaction history"},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():

        # Capture old data safely
        old_data = convert_uuids(ItemSerializer(item).data)
        item_code = item.item_code

        item.delete()

        # Audit log (UUID safe)
        create_audit_log(
            user=request.user,
            action="Deleted Material",
            module="Inventory",
            old_value=old_data,
            new_value=None
        )

    return Response(
        {
            "message": "Material deleted successfully",
            "data": {
                "item_code": item_code
            }
        },
        status=status.HTTP_200_OK
    )



# =========================================
# USE MATERIAL (Atomic Transaction)
# =========================================


from uuid import UUID
from django.shortcuts import get_object_or_404
from rest_framework import status

from .models import Item, InventoryTransaction, Vendor, TransactionType

from audit.utils import create_audit_log


# =========================================
# USE MATERIAL (Atomic Transaction)
# =========================================


from uuid import UUID
from django.shortcuts import get_object_or_404
from rest_framework import status


from .models import Item, InventoryTransaction, TransactionType

from audit.utils import create_audit_log
from django.contrib.auth import get_user_model
User = get_user_model()





@api_view(['POST'])
@permission_classes([IsAuthenticated])
def use_item(request, pk):

    

    # 🔐 Approval check
    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    item = get_object_or_404(Item, pk=pk)

    quantity_used = request.data.get("quantity_used")
    purpose = request.data.get("purpose")
    operator_name = request.data.get("operator_name", "").strip()  # ✅ ADDED

    # ✅ Basic validation
    if not operator_name:
        return Response(
            {"error": "Operator name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if quantity_used is None or not purpose:
        return Response(
            {"error": "Quantity and purpose required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        quantity_used = int(quantity_used)
    except (TypeError, ValueError):
        return Response(
            {"error": "Invalid quantity"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if quantity_used <= 0:
        return Response(
            {"error": "Quantity must be greater than 0"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if quantity_used > item.quantity:
        return Response(
            {"error": "Not enough stock"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    




    

    


    # =========================
    # ATOMIC TRANSACTION BLOCK
    # =========================
    with transaction.atomic():

        old_quantity = item.quantity

        # 🔻 Reduce stock
        item.quantity -= quantity_used
        item.save()

        # 🧾 Create transaction (system user, not operator login)
        InventoryTransaction.objects.create(
            item=item,
            transaction_type=TransactionType.USAGE,
            quantity=quantity_used,
            performed_by=request.user,   # system user
            purpose=f"{purpose} | Operator: {operator_name}"  # ✅ integrated
        )

        # 🔔 Usage Notification (BY OPERATOR NAME)
        Notification.objects.create(
            recipient_role="HIGH_AUTHORITY",
            type="USAGE",
            message=f"{quantity_used} units of {item.item_code} used by {operator_name}"
        )

        # 🔔 Auto Low Stock Alert
        if item.quantity <= item.min_quantity:
            Notification.objects.create(
                recipient_role="HIGH_AUTHORITY",
                type="LOW_STOCK",
                message=f"Low stock alert for {item.item_code}. Remaining: {item.quantity}"
            )

        # 🧾 Audit Log
        create_audit_log(
            user=request.user,
            action="Used Material",
            module="Inventory",
            old_value=convert_uuids({
                "item_id": item.id,
                "quantity": old_quantity
            }),
            new_value=convert_uuids({
                "item_id": item.id,
                "quantity": item.quantity,
                "operator_name": operator_name
            })
        )
# 📧 Email Notification
    # =========================
# EMAIL NOTIFICATION (SAFE)
# =========================

    try:
        subject = f"Material Used - {item.item_code}"

        message = message = f"""
        ===============================
        📦 MATERIAL USAGE ALERT
        ===============================

        🔢 Item Code: {item.item_code}
        ⚙️ Machine: {item.machine_name}

        📉 Quantity Used: {quantity_used}
        📦 Remaining Stock: {item.quantity}

        👷 Operator: {operator_name}
        🧑‍💻 Updated By: {getattr(request.user, "full_name", None) or request.user.email}

        📝 Purpose:
        {purpose}

        ⏰ Time: {timezone.now().strftime('%d-%m-%Y %H:%M:%S')}

        ===============================
        Inventory Management System
        ===============================
        """
        print("🔥 EMAIL BLOCK HIT - USE ITEM")
        recipients = list(
    User.objects.filter(role="HIGH_AUTHORITY")
    .exclude(email__isnull=True)
    .exclude(email__exact="")
    .values_list("email", flat=True)
)

        print("Recipients:", recipients)

        if not recipients:
          print("❌ No HIGH_AUTHORITY users found")

        send_mail(subject, message, settings.EMAIL_HOST_USER, recipients, fail_silently=False)

    except Exception as e:
        print("Usage Email Failed:", str(e))

    
  

    # =========================
    # STOCK STATUS (OUTSIDE TX)
    # =========================
    if item.quantity == 0:
        stock_status = "OUT_OF_STOCK"
    elif item.quantity <= item.min_quantity:
        stock_status = "LOW_STOCK"
    else:
        stock_status = "NORMAL"

    return Response({
        "message": "Material used successfully",
        "data": {
            "id": str(item.id),
            "item_code": item.item_code,
            "operator_name": operator_name,
            "quantity_used": quantity_used,
            "remaining_quantity": item.quantity,
            "stock_status": stock_status,
            "low_stock": item.quantity <= item.min_quantity
        }
    }, status=status.HTTP_200_OK)




# =========================================
# ADD STOCK (PURCHASE / RESTOCK)
# =========================================


from uuid import UUID

from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Item, InventoryTransaction, TransactionType

from audit.utils import create_audit_log





@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_stock(request, pk):

    # 🔐 Approval Check
    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    # 🔐 Role Check
    role_error = check_role(
        request.user,
        ['ADMIN', 'MANAGER', 'HIGH_AUTHORITY']
    )
    if role_error:
        return role_error

    item = get_object_or_404(Item, pk=pk)

    qty_added = request.data.get("quantity")
    purpose = request.data.get("purpose", "Stock Refill")

    # ------------------------
    # Validation
    # ------------------------

    if qty_added is None:
        return Response(
            {"error": "Quantity is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        qty_added = int(qty_added)
    except ValueError:
        return Response(
            {"error": "Invalid quantity"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if qty_added <= 0:
        return Response(
            {"error": "Quantity must be greater than 0"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ------------------------
    # Transaction Block
    # ------------------------

    with transaction.atomic():

        old_quantity = item.quantity
        item.quantity += qty_added
        item.save()

        # Determine stock status
        if item.quantity == 0:
            stock_status = "OUT_OF_STOCK"
        elif item.quantity <= item.min_quantity:
            stock_status = "LOW_STOCK"
        else:
            stock_status = "NORMAL"

        # Create Inventory Transaction
        InventoryTransaction.objects.create(
            item=item,
            transaction_type=TransactionType.PURCHASE,
            quantity=qty_added,
            performed_by=request.user,
            purpose=purpose
        )

        # Create Notification (only for HIGH_AUTHORITY)
        Notification.objects.create(
    recipient_role="HIGH_AUTHORITY",
    type="STOCK_ADDED",
    message=f"{qty_added} units added to {item.item_code}"
)


        # UUID-safe audit log
        create_audit_log(
            user=request.user,
            action="Added Stock",
            module="Inventory",
            old_value=convert_uuids({
                "item_id": item.id,
                "quantity": old_quantity
            }),
            new_value=convert_uuids({
                "item_id": item.id,
                "quantity": item.quantity
            })
        )

    # ------------------------
    # Clean Frontend Response
    # ------------------------

    return Response({
        "message": "Stock added successfully",
        "data": {
            "id": str(item.id),
            "item_code": item.item_code,
            "added_quantity": qty_added,
            "new_total_quantity": item.quantity,
            "stock_status": stock_status
        }
    }, status=status.HTTP_200_OK)





# =========================================
# ITEM TRANSACTION HISTORY
# =========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def item_transactions(request, pk):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    item = get_object_or_404(Item, pk=pk)

    transactions = (
        InventoryTransaction.objects
        .filter(item=item)
        .select_related("performed_by")
        .order_by("-created_at")
    )

    data = [
        {
            "id": t.id,
            "type": t.transaction_type,
            "quantity": t.quantity,
            "performed_by": t.performed_by.email if t.performed_by else None,
            "purpose": t.purpose,
            "date": t.created_at
        }
        for t in transactions
    ]

    return Response({
        "item_code": item.item_code,
        "current_quantity": item.quantity,
        "transactions": data
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_overview(request):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    search = request.GET.get('search')
    category = request.GET.get('category')
    low_stock = request.GET.get('low_stock')

    items = Item.objects.select_related('vendor').all()

    if search:
        items = items.filter(
            Q(item_code__icontains=search) |
            Q(description__icontains=search) |
            Q(machine_name__icontains=search)
        )

    if category:
        items = items.filter(maintenance_category=category)

    if low_stock == "true":
        items = items.filter(quantity__lte=F('min_quantity'))

    data = []

    for item in items.order_by('-created_at'):

        if item.quantity == 0:
            stock_status = "OUT_OF_STOCK"
        elif item.quantity <= item.min_quantity:
            stock_status = "LOW_STOCK"
        else:
            stock_status = "NORMAL"

        data.append({
            "id": item.id,
            "item_code": item.item_code,
            "description": item.description,
            "machine_name": item.machine_name,
            "location": {
                "cupboard": item.cupboard_no,
                "rack": item.rack_no
            },
            "quantity": item.quantity,
            "min_quantity": item.min_quantity,
            "maintenance_category": item.maintenance_category,
            "vendor": item.vendor.name if item.vendor else None,
            "stock_status": stock_status,
            "is_low_stock": item.quantity <= item.min_quantity
        })

    return Response({
        "count": len(data),
        "results": data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def filter_options(request):

    machines = Item.objects.values_list(
        'machine_name',
        flat=True
    ).distinct()

    categories = Item.objects.values_list(
        'maintenance_category',
        flat=True
    ).distinct()

    return Response({
        "machines": list(machines),
        "categories": list(categories)
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_summary(request):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    low_stock = Item.objects.filter(
        quantity__lte=F('min_quantity'),
        quantity__gt=0
    ).count()

    out_of_stock = Item.objects.filter(quantity=0).count()

    return Response({
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "total_attention_required": low_stock + out_of_stock
    })





@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):

    try:
        notification = Notification.objects.get(pk=pk)
    except Notification.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


    return Response({"message": "Notification marked as read"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_filters(request):

    # 🔐 Approval Check
    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    # Machines
    machines = list(
        Item.objects.values_list(
            'machine_name',
            flat=True
        ).distinct()
    )

    # Cupboards
    cupboards = list(
        Item.objects.values_list(
            'cupboard_no',
            flat=True
        ).distinct()
    )

    # Maintenance Categories
    categories = list(
        Item.objects.values_list(
            'maintenance_category',
            flat=True
        ).distinct()
    )

    # Vendors
    vendors_queryset = Item.objects.select_related(
        'vendor'
    ).values(
        'vendor__id',
        'vendor__name'
    ).distinct()

    vendors = [
        {
            "id": v["vendor__id"],
            "name": v["vendor__name"]
        }
        for v in vendors_queryset if v["vendor__id"]
    ]

    return Response({
        "machines": machines,
        "cupboards": cupboards,
        "categories": categories,
        "vendors": vendors,
        "status_options": [
            "NORMAL",
            "LOW_STOCK",
            "OUT_OF_STOCK"
        ]
    })

# =========================================
# GET ITEM TRANSACTION HISTORY
# =========================================

from rest_framework.pagination import PageNumberPagination

class TransactionPagination(PageNumberPagination):
    page_size = 10


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_item_transactions(request, pk):
    print("====== DEBUG ======")
    print("USER:", request.user)
    print("EMAIL:", getattr(request.user, "email", None))
    print("APPROVED:", getattr(request.user, "is_approved", None))
    print("ROLE:", getattr(request.user, "role", None))
    print("===================")

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    item = get_object_or_404(Item, pk=pk)

    transactions = InventoryTransaction.objects.filter(
        item=item
    ).select_related('performed_by').order_by('-created_at')

    paginator = TransactionPagination()
    paginated = paginator.paginate_queryset(transactions, request)

    data = []

    for tx in paginated:
        data.append({
            "transaction_id": str(tx.id),
            "type": tx.transaction_type,
            "quantity": tx.quantity,
            "performed_by": (
    getattr(tx.performed_by, "full_name", None)
    or getattr(tx.performed_by, "email", "System")
),
            "purpose": tx.purpose,
            "created_at": tx.created_at
        })

    return paginator.get_paginated_response({
        "item_code": item.item_code,
        "current_stock": item.quantity,
        "transactions": data
    })

# =========================================
# INVENTORY DASHBOARD SUMMARY
# =========================================

from django.db.models import Sum
from inventory.models import Item, InventoryTransaction


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_dashboard(request):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    total_materials = Item.objects.count()

    total_stock = Item.objects.aggregate(
        total_quantity=Sum('quantity')
    )['total_quantity'] or 0

    low_stock = Item.objects.filter(
        quantity__lte=F('min_quantity'),
        quantity__gt=0
    ).count()

    out_of_stock = Item.objects.filter(
        quantity=0
    ).count()

    recent_transactions = InventoryTransaction.objects.select_related(
        'item', 'performed_by'
    ).order_by('-created_at')[:5]

    recent_data = []

    for tx in recent_transactions:
        recent_data.append({
            "item_code": tx.item.item_code,
            "transaction_type": tx.transaction_type,
            "quantity": tx.quantity,
            "performed_by": tx.performed_by.email,
            "created_at": tx.created_at
        })

    return Response({
        "total_materials": total_materials,
        "total_stock_quantity": total_stock,
        "low_stock_items": low_stock,
        "out_of_stock_items": out_of_stock,
        "recent_activity": recent_data
    })


# =========================================
# AUTO REORDER SUGGESTIONS
# =========================================

from django.db.models import F


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reorder_suggestions(request):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    items = Item.objects.filter(
        quantity__lte=F('min_quantity')
    ).select_related('vendor')

    suggestions = []

    for item in items:

        # Suggested reorder logic
        suggested_qty = (item.min_quantity * 2) - item.quantity

        if suggested_qty < 0:
            suggested_qty = item.min_quantity

        # Urgency logic
        if item.quantity == 0:
            urgency = "CRITICAL"
        elif item.quantity <= item.min_quantity / 2:
            urgency = "HIGH"
        else:
            urgency = "MODERATE"

        suggestions.append({
            "id": str(item.id),
            "item_code": item.item_code,
            "current_quantity": item.quantity,
            "min_quantity": item.min_quantity,
            "suggested_reorder_quantity": suggested_qty,
            "vendor": item.vendor.name if item.vendor else None,
            "urgency_level": urgency
        })

    return Response({
        "total_items_to_reorder": len(suggestions),
        "reorder_suggestions": suggestions
    })


# =========================================
# ITEM TRANSACTION HISTORY
# =========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def item_history(request, pk):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    item = get_object_or_404(Item, pk=pk)

    transactions = InventoryTransaction.objects.filter(
        item=item
    ).select_related("performed_by").order_by("-created_at")

    history_data = []

    for txn in transactions:
        history_data.append({
            "id": txn.id,
            "transaction_type": txn.transaction_type,
            "quantity": txn.quantity,
            "purpose": txn.purpose,
            "performed_by": txn.performed_by.email if txn.performed_by else None,
            "date": txn.created_at
        })

    return Response({
        "item_code": item.item_code,
        "history": history_data
    })


# =========================================
# UNREAD NOTIFICATION COUNT
# =========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_notification_count(request):

    approval_error = check_approved(request.user)
    if approval_error:
        return approval_error

    user_role = request.user.role

    count = Notification.objects.filter(
        recipient_role=user_role,
        is_read=False
    ).count()

    return Response({
        "unread_count": count
    })

# =========================================
# MARK NOTIFICATIONS AS READ
# =========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):

    user_role = request.user.role

    Notification.objects.filter(
        recipient_role=user_role,
        is_read=False
    ).update(is_read=True)

    return Response({
        "message": "Notifications marked as read"
    })

# =========================================
# GENERATE INVENTORY REPORT (FILTERED)
# =========================================

from django.db.models import Q
from .models import Item

def get_filtered_items(request):

    search = request.GET.get('search')
    category = request.GET.get('category')
    machine = request.GET.get('machine')
    cupboard = request.GET.get('cupboard')
    vendor = request.GET.get('vendor')

    items = Item.objects.select_related('vendor').all()

    if search:
        items = items.filter(
            Q(item_code__icontains=search) |
            Q(description__icontains=search) |
            Q(machine_name__icontains=search)
        )

    if category:
        items = items.filter(maintenance_category=category)

    if machine:
        items = items.filter(machine_name=machine)

    if cupboard:
        items = items.filter(cupboard_no=cupboard)

    if vendor:
        items = items.filter(vendor__id=vendor)

    return items

from datetime import datetime
from django.utils.timezone import make_aware

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_report(request):

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    transactions = InventoryTransaction.objects.select_related("item")

    # 📅 Date Range Filtering
    if start_date:
        try:
            start = make_aware(datetime.strptime(start_date, "%Y-%m-%d"))
            transactions = transactions.filter(created_at__gte=start)
        except:
            return Response({"error": "Invalid start_date format. Use YYYY-MM-DD"}, status=400)

    if end_date:
        try:
            end = make_aware(datetime.strptime(end_date, "%Y-%m-%d"))
            transactions = transactions.filter(created_at__lte=end)
        except:
            return Response({"error": "Invalid end_date format. Use YYYY-MM-DD"}, status=400)

    data = []

    for t in transactions.order_by("-created_at"):

        if t.item.quantity == 0:
            status = "OUT_OF_STOCK"
        elif t.item.quantity <= t.item.min_quantity:
            status = "LOW_STOCK"
        else:
            status = "NORMAL"

        data.append({
            "item_code": t.item.item_code,
            "machine_name": t.item.machine_name,
            "category": t.item.maintenance_category,
            "transaction_type": t.transaction_type,
            "quantity": t.quantity,
            "performed_by": t.performed_by.email,
            "date": t.created_at,
            "stock_status": status
        })

    return Response({
        "filters_applied": {
            "start_date": start_date,
            "end_date": end_date
        },
        "total_records": len(data),
        "data": data
    })

# =========================================
# DOWNLOAD EXCEL REPORT
# =========================================

from openpyxl import Workbook
from django.http import HttpResponse


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_excel(request):

    items = get_filtered_items(request)

    wb = Workbook()
    ws = wb.active
    ws.title = "Inventory Report"

    headers = [
        "Item Code",
        "Description",
        "Machine",
        "Location",
        "Category",
        "Vendor",
        "Quantity",
        "Min Quantity",
        "Status"
    ]

    ws.append(headers)

    for item in items:

        if item.quantity == 0:
            status = "OUT_OF_STOCK"
        elif item.quantity <= item.min_quantity:
            status = "LOW_STOCK"
        else:
            status = "NORMAL"

        ws.append([
            item.item_code,
            item.description,
            item.machine_name,
            f"{item.cupboard_no}/{item.rack_no}",
            item.maintenance_category,
            item.vendor.name if item.vendor else "",
            item.quantity,
            item.min_quantity,
            status
        ])

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename=inventory_report.xlsx'

    wb.save(response)

    return response

# =========================================
# DOWNLOAD PDF REPORT
# =========================================

from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import ListFlowable, ListItem
from io import BytesIO


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_pdf(request):

    items = get_filtered_items(request)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    data = [[
        "Item Code",
        "Machine",
        "Qty",
        "Min Qty",
        "Status"
    ]]

    for item in items:

        if item.quantity == 0:
            status = "OUT_OF_STOCK"
        elif item.quantity <= item.min_quantity:
            status = "LOW_STOCK"
        else:
            status = "NORMAL"

        data.append([
            item.item_code,
            item.machine_name,
            item.quantity,
            item.min_quantity,
            status
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))

    elements.append(table)
    doc.build(elements)

    pdf = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename=inventory_report.pdf'

    return response



from django.db.models import Q
from django.utils.dateparse import parse_date
from .models import InventoryTransaction


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def high_authority_usage_logs(request):

    # 🔐 Role protection
    allowed_roles = ["HIGH_AUTHORITY", "MANAGER", "ADMIN"]

    if request.user.role not in allowed_roles:
        return Response({"error": "Access denied"}, status=403)

    date_filter = request.GET.get("date")

    transactions = InventoryTransaction.objects.select_related(
        "item",
        "performed_by"
    ).filter(
        transaction_type="USAGE"
    ).order_by("-created_at")

    # 📅 Date filter
    if date_filter:
        try:
            day, month, year = date_filter.split("-")
            formatted_date = f"{year}-{month}-{day}"
            transactions = transactions.filter(created_at__date=formatted_date)
        except:
            return Response(
                {"error": "Invalid date format. Use dd-mm-yyyy"},
                status=400
            )

    data = []

    for tx in transactions:

        operator_name = "Unknown"

        if tx.purpose and "Operator:" in tx.purpose:
            operator_name = tx.purpose.split("Operator:")[1].strip()

        data.append({
            "id": str(tx.id),
            "operator_name": operator_name,
            "item_code": tx.item.item_code,
            "quantity_used": tx.quantity,
            "purpose": tx.purpose.split("|")[0].strip() if tx.purpose else "",
            "date": tx.created_at.strftime("%d-%m-%Y"),
            "time": tx.created_at.strftime("%H:%M:%S"),
            "approval_status": tx.approval_status
        })

    return Response({
        "count": len(data),
        "results": data
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):

    notifications = Notification.objects.filter(
        recipient_role="HIGH_AUTHORITY"
    ).order_by("-created_at")

    data = [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifications
    ]

    return Response({
        "count": notifications.count(),
        "notifications": data
    })



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_count(request):

    count = Notification.objects.filter(
        recipient_role="HIGH_AUTHORITY",
        is_read=False
    ).count()

    return Response({
        "unread_count": count
    })



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):

    notification = get_object_or_404(Notification, pk=pk)

    notification.is_read = True
    notification.save()

    return Response({
        "message": "Notification marked as read"
    }, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_notification_count(request):

    count = Notification.objects.filter(
        recipient_role="HIGH_AUTHORITY",
        is_read=False
    ).count()

    return Response({
        "unread_count": count
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):

    Notification.objects.filter(
        recipient_role="HIGH_AUTHORITY",
        is_read=False
    ).update(is_read=True)

    return Response({
        "message": "All notifications marked as read"
    })



from audit.models import AuditLog


from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import InventoryItem
from .serializers import InventoryItemSerializer


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = [
        "machine_name",
        "vendor_name",
        "cupboard_no",
        "maintenance_category",
        "material_type",
    ]
    search_fields = ["item_code", "description"]


@api_view(["GET"])
def inventory_history(request):
    transactions = InventoryTransaction.objects.select_related("item", "performed_by").order_by("-created_at")

    data = []

    for t in transactions:
        data.append({
            "id": str(t.id),
            "date": t.created_at.strftime("%d-%m-%Y"),
            "item_code": t.item.item_code,
            "description": t.item.description,
            "action": t.transaction_type,
            "qty_change": t.quantity,
            "performed_by": t.operator_name or (t.performed_by.email if t.performed_by else "System"),
        })

    return Response(data)

def send_safe_email(subject, message, recipient_list):
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            recipient_list,
            fail_silently=True
        )
    except Exception as e:
        print("EMAIL ERROR:", str(e))