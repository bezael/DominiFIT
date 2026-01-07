import {
  getCurrentSubscription,
  getMembershipStatus,
  type MembershipStatus,
  type Subscription
} from '@/lib/membership';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export interface UseMembershipReturn {
  hasActiveMembership: boolean;
  membershipStatus: MembershipStatus | null;
  subscription: Subscription | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para gestionar el estado de membresía del usuario
 * 
 * @example
 * ```tsx
 * const { hasActiveMembership, loading, refresh } = useMembership();
 * 
 * if (loading) return <Loading />;
 * if (hasActiveMembership) {
 *   return <PremiumFeatures />;
 * }
 * ```
 */
export function useMembership(): UseMembershipReturn {
  const { user, isAuthenticated } = useAuth();
  const [hasActive, setHasActive] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setHasActive(false);
      setMembershipStatus(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener estado completo de membresía
      const status = await getMembershipStatus(user.id);
      setMembershipStatus(status);
      setHasActive(status.hasActiveMembership);

      // Obtener suscripción actual
      const currentSubscription = await getCurrentSubscription(user.id);
      setSubscription(currentSubscription);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      console.error('Error refrescando membresía:', error);
      setHasActive(false);
      setMembershipStatus(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Cargar membresía al montar y cuando cambie el usuario
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Escuchar cambios en la tabla de suscripciones (opcional, usando Supabase Realtime)
  // Nota: Requiere habilitar Realtime en Supabase Dashboard para la tabla subscriptions
  useEffect(() => {
    if (!user) return;

    // Opcional: Usar Supabase Realtime para actualizaciones en tiempo real
    // Descomenta si quieres habilitar esta funcionalidad:
    /*
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refrescar cuando haya cambios
          refresh();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    */
  }, [user, refresh]);

  return {
    hasActiveMembership: hasActive,
    membershipStatus,
    subscription,
    loading,
    error,
    refresh,
  };
}

