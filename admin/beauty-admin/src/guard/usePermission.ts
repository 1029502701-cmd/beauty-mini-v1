import { useEffect, useState } from "react";
import type { AdminRole, MenuResource, PermissionAction } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";

const usePermission = () => {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_session");
    if (stored) {
      try {
        const session = JSON.parse(stored) as { role: AdminRole };
        setRole(session.role);
      } catch {
        localStorage.removeItem("admin_session");
      }
    }
    setLoading(false);
  }, []);

  /**
   * can - Check if the current role has permission for a resource + action.
   * Supports button-level permission checking.
   */
  const can = (resource: MenuResource, action: PermissionAction): boolean => {
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role].find((p) => p.resource === resource);
    if (!perms) return false;
    return perms.actions.includes(action);
  };

  /**
   * hasRole - Check if the current role matches the target role.
   */
  const hasRole = (targetRole: AdminRole): boolean => {
    if (!role) return false;
    return role === targetRole;
  };

  /**
   * canAny - Check if the current role has any of the given actions.
   * Useful for showing/hiding entire sections.
   */
  const canAny = (resource: MenuResource, actions: PermissionAction[]): boolean => {
    return actions.some((a) => can(resource, a));
  };

  /**
   * require - Throws if the current role lacks permission.
   * Use in event handlers to guard actions.
   */
  const require = (resource: MenuResource, action: PermissionAction): void => {
    if (!can(resource, action)) {
      throw new Error(`Permission denied: ${resource}/${action}`);
    }
  };

  return { role, loading, can, hasRole, canAny, require };
};

export default usePermission;
