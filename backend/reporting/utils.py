from django.db.models import Q, Sum
from inventory.models import Item, InventoryTransaction
from datetime import datetime
from django.db.models import F

def apply_report_filters(request):

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    machine = request.GET.get("machine")
    category = request.GET.get("category")
    status = request.GET.get("status")

    items = Item.objects.all()
    transactions = InventoryTransaction.objects.all()

    # ----------------------
    # MACHINE FILTER
    # ----------------------
    if machine:
        items = items.filter(machine_name=machine)
        transactions = transactions.filter(item__machine_name=machine)

    # ----------------------
    # CATEGORY FILTER
    # ----------------------
    if category:
        items = items.filter(maintenance_category=category)
        transactions = transactions.filter(item__maintenance_category=category)

    # ----------------------
    # DATE FILTER
    # ----------------------
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            transactions = transactions.filter(created_at__range=[start, end])
        except:
            pass

    # ----------------------
    # STATUS FILTER
    # ----------------------
    if status:
        if status == "LOW_STOCK":
            items = items.filter(quantity__lte=F("min_quantity"), quantity__gt=0)
        elif status == "OUT_OF_STOCK":
            items = items.filter(quantity=0)
        elif status == "NORMAL":
            items = items.filter(quantity__gt=F("min_quantity"))

    return items, transactions
from openpyxl import Workbook
from django.http import HttpResponse


def export_to_excel(filename, headers, data_rows):
    wb = Workbook()
    ws = wb.active
    ws.title = "Data"

    # Write headers
    ws.append(headers)

    # Write rows
    for row in data_rows:
        ws.append(row)

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'

    wb.save(response)
    return response


