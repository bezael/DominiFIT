# Configuración de Stripe Checkout

## Variables de Entorno

Añade las siguientes variables a tu archivo `.env`:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
VITE_STRIPE_PRICE_ID=price_tu_price_id_aqui

# Supabase (ya deberías tener estas configuradas)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key_aqui

# Opcional: Si usas un backend personalizado en lugar de Supabase Edge Functions
# VITE_API_URL=http://localhost:3000/api
```

**IMPORTANTE:** La `STRIPE_SECRET_KEY` NO debe estar en el `.env` del frontend. Solo se usa en el backend (Supabase Edge Function).

## Endpoint del Backend

Necesitas crear un endpoint en tu backend que cree la sesión de checkout de Stripe. Aquí tienes un ejemplo usando Node.js/Express:

### Ejemplo con Express.js

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Para identificar al usuario después del pago
      metadata: {
        userId: userId || 'anonymous',
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error al crear sesión de checkout:', error);
    res.status(500).json({ 
      message: error.message || 'Error al crear la sesión de checkout' 
    });
  }
});

module.exports = router;
```

### Usando Supabase Edge Functions (Recomendado)

Ya se ha creado la función en `supabase/functions/create-checkout-session/index.ts`. 

**Pasos para configurar:**

1. **Instalar Supabase CLI** (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

2. **Iniciar sesión en Supabase CLI:**
   ```bash
   supabase login
   ```

3. **Vincular tu proyecto:**
   ```bash
   supabase link --project-ref tu-project-ref
   ```
   (Puedes encontrar tu project-ref en la URL de tu proyecto: `https://app.supabase.com/project/tu-project-ref`)

4. **Configurar el secreto de Stripe:**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_FFy7VeYQS3mbHjq0zriKKidX
   ```

5. **Desplegar la función:**
   ```bash
   supabase functions deploy create-checkout-session
   ```****

6. **Para desarrollo local (opcional):**
   ```bash
   supabase start
   supabase functions serve create-checkout-session
   ```

La función ya está configurada para usar automáticamente la URL de Supabase si no especificas `VITE_API_URL` en tu `.env`.

## Pasos para Configurar

1. **Obtener las claves de Stripe:**
   - Ve a https://dashboard.stripe.com/test/apikeys
   - Copia tu `Publishable key` (pk_test_...)
   - Copia tu `Secret key` (sk_test_...)
   - Añade la `Publishable key` a tu archivo `.env` como `VITE_STRIPE_PUBLISHABLE_KEY`
   - **NO** añadas la `Secret key` al `.env` del frontend (solo se usa en el backend)

2. **Crear un Producto y Precio en Stripe:**
   - Ve a https://dashboard.stripe.com/test/products
   - Crea un nuevo producto (ej: "Premium Plan")
   - Añade un precio (ej: 12.99€/mes)
   - Copia el `Price ID` (empieza con `price_`)
   - Añádelo a tu archivo `.env` como `VITE_STRIPE_PRICE_ID`

3. **Configurar Supabase Edge Function:**
   - Sigue los pasos en la sección "Usando Supabase Edge Functions" arriba
   - Configura el secreto de Stripe con: `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`
   - Despliega la función: `supabase functions deploy create-checkout-session`

4. **Configurar Webhooks (Opcional pero recomendado):**
   - Ve a https://dashboard.stripe.com/test/webhooks
   - Añade un endpoint para recibir eventos de Stripe
   - Escucha el evento `checkout.session.completed` para activar la suscripción del usuario

## Manejo de Webhooks

Cuando un usuario complete el pago, Stripe enviará un webhook. Aquí tienes un ejemplo de cómo manejarlo:

```javascript
// Endpoint para webhooks de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    
    // Aquí actualizas la base de datos para activar la suscripción del usuario
    // Por ejemplo, en Supabase:
    // await supabase
    //   .from('subscriptions')
    //   .insert({ user_id: userId, status: 'active', stripe_session_id: session.id });
  }

  res.json({ received: true });
});
```

## Notas Importantes

- En desarrollo, usa las claves de prueba (`pk_test_` y `sk_test_`)
- En producción, usa las claves en vivo (`pk_live_` y `sk_live_`)
- Nunca expongas tu `STRIPE_SECRET_KEY` en el frontend
- El `STRIPE_SECRET_KEY` solo debe estar en el backend
- Configura las URLs de éxito y cancelación según tu aplicación
