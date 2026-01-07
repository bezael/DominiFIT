/**
 * ============================================
 * SISTEMA DE MEMBRESÍAS - FUNCIONES DE UTILIDAD
 * ============================================
 * 
 * Este módulo proporciona funciones para verificar y gestionar
 * el estado de membresías de usuarios.
 * 
 * IMPORTANTE: Las verificaciones de membresía NUNCA deben confiar
 * en datos del frontend. Siempre se validan contra Supabase/Stripe.
 */

import { supabase } from './supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MembershipStatus {
  hasActiveMembership: boolean;
  subscription: Subscription | null;
  isTrialing: boolean;
  daysUntilExpiration: number | null;
  willCancelAtPeriodEnd: boolean;
}

/**
 * Verifica si un usuario tiene una membresía activa
 * 
 * @param userId - ID del usuario (opcional, si no se proporciona usa el usuario actual)
 * @returns Promise<boolean> - true si tiene membresía activa
 * 
 * @example
 * ```typescript
 * const isActive = await hasActiveMembership();
 * if (isActive) {
 *   // Permitir acceso a features premium
 * }
 * ```
 */
export async function hasActiveMembership(userId?: string): Promise<boolean> {
  try {
    // Si no se proporciona userId, obtener el usuario actual
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return false;
      }
      targetUserId = user.id;
    }

    // Consultar suscripción activa
    const { data, error } = await supabase
      .from('sass_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .eq('cancel_at_period_end', false)
      .maybeSingle();

    if (error) {
      console.error('Error verificando membresía:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error en hasActiveMembership:', error);
    return false;
  }
}

/**
 * Obtiene el estado completo de membresía de un usuario
 * 
 * @param userId - ID del usuario (opcional)
 * @returns Promise<MembershipStatus> - Estado completo de la membresía
 * 
 * @example
 * ```typescript
 * const status = await getMembershipStatus();
 * if (status.hasActiveMembership) {
 *   console.log(`Membresía activa hasta ${status.daysUntilExpiration} días`);
 * }
 * ```
 */
export async function getMembershipStatus(userId?: string): Promise<MembershipStatus> {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          hasActiveMembership: false,
          subscription: null,
          isTrialing: false,
          daysUntilExpiration: null,
          willCancelAtPeriodEnd: false,
        };
      }
      targetUserId = user.id;
    }

    // Obtener la suscripción más reciente (activa o trialing)
    const { data: subscription, error } = await supabase
      .from('sass_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .in('status', ['active', 'trialing'])
      .gt('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error obteniendo estado de membresía:', error);
      return {
        hasActiveMembership: false,
        subscription: null,
        isTrialing: false,
        daysUntilExpiration: null,
        willCancelAtPeriodEnd: false,
      };
    }

    if (!subscription) {
      return {
        hasActiveMembership: false,
        subscription: null,
        isTrialing: false,
        daysUntilExpiration: null,
        willCancelAtPeriodEnd: false,
      };
    }

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const daysUntilExpiration = Math.ceil(
      (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const hasActiveMembership = 
      subscription.status === 'active' && 
      periodEnd > now &&
      !subscription.cancel_at_period_end;

    return {
      hasActiveMembership,
      subscription: subscription as Subscription,
      isTrialing: subscription.status === 'trialing',
      daysUntilExpiration: daysUntilExpiration > 0 ? daysUntilExpiration : 0,
      willCancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error en getMembershipStatus:', error);
    return {
      hasActiveMembership: false,
      subscription: null,
      isTrialing: false,
      daysUntilExpiration: null,
      willCancelAtPeriodEnd: false,
    };
  }
}

/**
 * Obtiene la suscripción actual de un usuario
 * 
 * @param userId - ID del usuario (opcional)
 * @returns Promise<Subscription | null>
 */
export async function getCurrentSubscription(userId?: string): Promise<Subscription | null> {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return null;
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('sass_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error obteniendo suscripción:', error);
      return null;
    }

    return data as Subscription | null;
  } catch (error) {
    console.error('Error en getCurrentSubscription:', error);
    return null;
  }
}

/**
 * Verifica la membresía contra Stripe directamente (para casos edge)
 * 
 * Esta función debe ser llamada desde el backend (Edge Function) ya que
 * requiere STRIPE_SECRET_KEY que no debe estar en el frontend.
 * 
 * @param subscriptionId - ID de la suscripción en Stripe
 * @returns Promise<boolean> - true si la suscripción está activa en Stripe
 */
export async function verifyMembershipWithStripe(
  subscriptionId: string
): Promise<boolean> {
  try {
    // Esta función debe llamarse desde una Edge Function
    // ya que requiere STRIPE_SECRET_KEY
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/verify-membership`;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isActive === true;
  } catch (error) {
    console.error('Error verificando membresía con Stripe:', error);
    return false;
  }
}

/**
 * Sincroniza manualmente la suscripción con Stripe
 * 
 * Útil cuando hay inconsistencias entre Supabase y Stripe
 * 
 * @param subscriptionId - ID de la suscripción en Stripe
 * @returns Promise<boolean> - true si la sincronización fue exitosa
 */
export async function syncSubscriptionWithStripe(
  subscriptionId: string
): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/sync-subscription`;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sincronizando suscripción:', error);
    return false;
  }
}
