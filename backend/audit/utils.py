import json
from .models import AuditLog


def create_audit_log(user, action, module, old_value=None, new_value=None):

    AuditLog.objects.create(
        user=user,
        action=action,
        module=module,
        old_value=json.dumps(old_value, default=str) if old_value else None,
        new_value=json.dumps(new_value, default=str) if new_value else None,
    )

