import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ActionType, ScopeType, ModulePermission, Module, RolePermission } from '@/types/auth.types';

interface UserModulePermissionData {
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: string;
}

export function usePermissions() {
  const { user, role, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      // If authenticated but role not yet loaded, keep loading
      if (isAuthenticated && !role) {
        setIsLoading(true);
        return;
      }
      
      // Not authenticated - no permissions needed
      if (!user || !role) {
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch modules
        const { data: modules } = await supabase
          .from('modules')
          .select('*')
          .eq('is_active', true);

      // Fetch role_id based on role name
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .maybeSingle();

      // Fetch permissions for user's role using role_id
      const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleData?.id || '');

        // Fetch custom user permissions (overrides)
        const { data: userPerms } = await supabase
          .from('user_module_permissions')
          .select('*')
          .eq('user_id', user.id);

        // Create lookup map for user permissions
        const userPermsMap = (userPerms || []).reduce((acc, perm) => {
          acc[perm.module_id] = perm;
          return acc;
        }, {} as Record<string, UserModulePermissionData>);

        if (modules && rolePerms) {
          const mappedPermissions: ModulePermission[] = modules.map((module: Module) => {
            // Check for custom user permission first (override)
            const userPerm = userPermsMap[module.id];
            if (userPerm) {
              return {
                module,
                can_view: userPerm.can_view,
                can_create: userPerm.can_create,
                can_edit: userPerm.can_edit,
                can_delete: userPerm.can_delete,
                scope: userPerm.scope as ScopeType
              };
            }
            
            // Fall back to role permission
            const rolePerm = rolePerms.find((p: any) => p.module_id === module.id);
            return {
              module,
              can_view: rolePerm?.can_view ?? false,
              can_create: rolePerm?.can_create ?? false,
              can_edit: rolePerm?.can_edit ?? false,
              can_delete: rolePerm?.can_delete ?? false,
              scope: (rolePerm?.scope as ScopeType) ?? 'proprio'
            };
          });
          setPermissions(mappedPermissions);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [user, role]);

  const isSuperAdmin = useCallback(() => {
    return role === 'super_admin';
  }, [role]);

  const isAdmin = useCallback(() => {
    return role === 'admin' || role === 'super_admin';
  }, [role]);

  const canAccessModule = useCallback((moduleName: string, action: ActionType = 'view'): boolean => {
    if (!isAuthenticated) return false;
    if (role === 'admin' || role === 'super_admin') return true;

    const perm = permissions.find(p => p.module.name === moduleName);
    if (!perm) return false;

    switch (action) {
      case 'view':
        return perm.can_view;
      case 'create':
        return perm.can_create;
      case 'edit':
        return perm.can_edit;
      case 'delete':
        return perm.can_delete;
      default:
        return false;
    }
  }, [isAuthenticated, role, permissions]);

  const getModuleScope = useCallback((moduleName: string): ScopeType | null => {
    if (role === 'admin' || role === 'super_admin') return 'global';

    const perm = permissions.find(p => p.module.name === moduleName);
    return perm?.scope ?? null;
  }, [role, permissions]);

  const canAccessEmpreendimento = useCallback(async (empreendimentoId: string): Promise<boolean> => {
    if (!user) return false;
    if (role === 'admin' || role === 'super_admin') return true;

    const { data } = await supabase
      .from('user_empreendimentos')
      .select('id')
      .eq('user_id', user.id)
      .eq('empreendimento_id', empreendimentoId)
      .maybeSingle();

    return !!data;
  }, [user, role]);

  const getUserEmpreendimentos = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    if (role === 'admin' || role === 'super_admin') return []; // Admin has access to all

    const { data } = await supabase
      .from('user_empreendimentos')
      .select('empreendimento_id')
      .eq('user_id', user.id);

    return data?.map(d => d.empreendimento_id) ?? [];
  }, [user, role]);

  return {
    permissions,
    isLoading,
    isSuperAdmin,
    isAdmin,
    canAccessModule,
    getModuleScope,
    canAccessEmpreendimento,
    getUserEmpreendimentos
  };
}
