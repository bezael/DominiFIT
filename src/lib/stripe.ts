import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      'Falta la variable de entorno VITE_STRIPE_PUBLISHABLE_KEY. Por favor, configúrala en tu archivo .env'
    );
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
) => {
  // Intentar usar Supabase Edge Functions primero
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiUrl = import.meta.env.VITE_API_URL;

  // Si hay una URL de API personalizada, usarla
  const endpoint = apiUrl 
    ? `${apiUrl}/create-checkout-session`
    : supabaseUrl 
    ? `${supabaseUrl}/functions/v1/create-checkout-session`
    : null;

  if (!endpoint) {
    throw new Error(
      'Falta la variable de entorno VITE_API_URL o VITE_SUPABASE_URL. Por favor, configúrala en tu archivo .env'
    );
  }

  try {
    // Si usamos Supabase, necesitamos el token de autenticación
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Si es Supabase Edge Function, necesitamos el token de sesión del usuario
    if (endpoint.includes('/functions/v1/')) {
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      
      // Obtener el token de sesión del usuario autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Error al obtener la sesión: ${sessionError.message}`);
      }

      if (!session?.access_token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión primero.');
      }

      // Las Edge Functions de Supabase requieren:
      // 1. El token de sesión del usuario en Authorization
      // 2. La anon key en apikey
      headers['Authorization'] = `Bearer ${session.access_token}`;
      if (supabaseAnonKey) {
        headers['apikey'] = supabaseAnonKey;
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let errorMessage = 'Error al crear la sesión de checkout';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log("Response from backend:", data);

    // Detectar si el backend devolvió una sesión de tipo Embedded (ui_mode: 'embedded')
    // Las sesiones embedded devuelven client_secret pero NO url de redirección
    if (!data.url && (data.clientSecret || data.client_secret)) {
      console.error("ERROR CRÍTICO: El backend devolvió una sesión Embedded (tiene client_secret) pero no una URL.");
      throw new Error(
        "El backend está configurado para 'Embedded Checkout' (ui_mode: 'embedded'), pero el frontend espera 'Hosted Checkout'. " +
        "Por favor, elimina `ui_mode: 'embedded'` de tu backend (Supabase Edge Function) para usar la redirección estándar."
      );
    }
    
    // Retornar la URL de la sesión para redirección manual
    if (data.url) {
      // Verificar que sea una URL válida de Stripe
      if (data.url.startsWith('https://checkout.stripe.com/') || data.url.startsWith('http://checkout.stripe.com/')) {
        return data.url;
      }
      // Si es una URL relativa o local, es un error
      if (data.url.startsWith('http://localhost') || data.url.startsWith('/')) {
        console.error("ERROR: URL recibida no es una URL válida de Stripe:", data.url);
        throw new Error('La URL de checkout recibida no es válida. Por favor, contacta al soporte.');
      }
      return data.url;
    }
    
    // Si no hay URL pero hay sessionId, construir la URL manualmente
    const sessionId = data.sessionId || data.id;
    if (sessionId) {
      console.warn("No se recibió URL, construyendo desde sessionId:", sessionId);
      // Construir la URL de Stripe Checkout usando el formato correcto
      // El formato es: https://checkout.stripe.com/c/pay/{session_id}
      const constructedUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
      console.log("URL construida manualmente:", constructedUrl);
      return constructedUrl;
    }
    
    // Si no hay URL ni sessionId, esto es un error crítico
    console.error("ERROR: No se recibió URL ni sessionId de checkout:", data);
    throw new Error('No se recibió una URL de checkout válida ni un ID de sesión del servidor. Por favor, intenta de nuevo.');
  } catch (error) {
    console.error('Error al crear sesión de checkout:', error);
    
    // Mejorar el mensaje de error para "Failed to fetch"
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'No se pudo conectar con el servidor. Por favor, verifica que el endpoint del backend esté configurado correctamente.'
      );
    }
    
    throw error;
  }
};

/**
 * Redirige al usuario a la sesión de checkout de Stripe.
 * @param checkoutUrl - La URL de la sesión de checkout obtenida de createCheckoutSession
 */
export const redirectToCheckout = (checkoutUrl: string) => {
  if (!checkoutUrl) {
    throw new Error('No se proporcionó una URL de checkout válida');
  }

  // Redirigir manualmente usando window.location
  // Esto reemplaza el método deprecado stripe.redirectToCheckout()
  window.location.href = checkoutUrl;
};
