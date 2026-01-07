# 🔗 Guía Rápida: Configurar Webhook en Stripe

## 📍 Paso 1: Obtener tu URL de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **URL** (Project URL)
   - Ejemplo: `https://abcdefghijklmnop.supabase.co`

## 🔗 Paso 2: Construir la URL del Webhook

La URL del endpoint será:
```
https://TU-PROJECT-REF.supabase.co/functions/v1/stripe-webhook
```

**Ejemplo:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/stripe-webhook
```

⚠️ **Importante:** 
- No agregues una barra final (`/`) al final
- Asegúrate de que la función `stripe-webhook` esté desplegada

## 🎯 Paso 3: Configurar el Webhook en Stripe

### Para Modo Test (Desarrollo)

1. Ve a [Stripe Dashboard - Test Mode](https://dashboard.stripe.com/test/webhooks)
2. Click en **Add endpoint**
3. En **Endpoint URL**, pega tu URL:
   ```
   https://TU-PROJECT-REF.supabase.co/functions/v1/stripe-webhook
   ```
4. En **Description** (opcional), escribe:
   ```
   Supabase Edge Function - Webhook para membresías
   ```
5. Click en **Select events to listen to**
6. Selecciona los siguientes eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
7. Click en **Add endpoint**

### Para Modo Live (Producción)

1. Asegúrate de estar en **Live mode** (toggle en la parte superior)
2. Ve a [Stripe Dashboard - Live Mode](https://dashboard.stripe.com/webhooks)
3. Sigue los mismos pasos que en modo test

## 🔐 Paso 4: Obtener el Signing Secret

1. Después de crear el webhook, click en él
2. En la sección **Signing secret**, click en **Reveal**
3. Copia el secreto (empieza con `whsec_`)
   - Ejemplo: `whsec_1234567890abcdef...`

## ⚙️ Paso 5: Configurar el Secret en Supabase

### Opción A: Usando Supabase CLI (Recomendado)

```bash
# Asegúrate de estar enlazado a tu proyecto
supabase link --project-ref TU-PROJECT-REF

# Configurar el webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Opción B: Desde el Dashboard

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Ve a **Project Settings** → **Edge Functions**
3. En la sección **Secrets**, agrega:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (el secreto que copiaste)
4. Click en **Save**

## ✅ Paso 6: Verificar que la Función Está Desplegada

```bash
# Verificar funciones desplegadas
supabase functions list

# Si no está desplegada, despliégala:
supabase functions deploy stripe-webhook
```

## 🧪 Paso 7: Probar el Webhook

### Opción A: Usando Stripe CLI (Local)

```bash
# Instalar Stripe CLI si no lo tienes
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Descargar desde https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks a tu función local
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# En otra terminal, trigger un evento de prueba
stripe trigger checkout.session.completed
```

### Opción B: Probar con un Checkout Real

1. Crea un checkout desde tu aplicación
2. Completa el pago con una tarjeta de prueba:
   - **Número:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura
   - **CVC:** Cualquier 3 dígitos
3. Ve a **Stripe Dashboard** → **Webhooks** → Tu webhook → **Events**
4. Deberías ver el evento `checkout.session.completed` con estado `Succeeded`

## 🔍 Verificar que Funciona

### 1. Verificar en Stripe Dashboard

- Ve a **Webhooks** → Tu webhook → **Events**
- Deberías ver eventos con estado `Succeeded` (verde) ✅
- Si hay errores, verás el mensaje de error

### 2. Verificar en Supabase

```sql
-- Ver eventos procesados
SELECT * FROM public.sass_webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver suscripciones creadas
SELECT * FROM public.sass_subscriptions 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Verificar Logs de Edge Functions

1. Ve a **Supabase Dashboard** → **Edge Functions**
2. Click en `stripe-webhook`
3. Ve a la pestaña **Logs**
4. Deberías ver logs de eventos procesados

## ❌ Troubleshooting

### Error: "Webhook signature verification failed"

**Causa:** El `STRIPE_WEBHOOK_SECRET` no coincide con el del Dashboard de Stripe.

**Solución:**
1. Verifica que copiaste el secreto correcto (debe empezar con `whsec_`)
2. Asegúrate de usar el secreto del modo correcto (test vs live)
3. Vuelve a configurar el secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Error: "404 Not Found"

**Causa:** La función Edge Function no está desplegada o la URL es incorrecta.

**Solución:**
1. Verifica la URL (sin trailing slash)
2. Despliega la función:
   ```bash
   supabase functions deploy stripe-webhook
   ```

### Error: "No events received"

**Causa:** Los eventos no están seleccionados o el webhook no está activo.

**Solución:**
1. Verifica en Stripe Dashboard que los eventos estén seleccionados
2. Verifica que el webhook esté en estado "Enabled"
3. Prueba con `stripe trigger checkout.session.completed`

## 📝 Checklist Final

- [ ] URL del webhook configurada correctamente
- [ ] Eventos seleccionados en Stripe
- [ ] Signing secret copiado
- [ ] `STRIPE_WEBHOOK_SECRET` configurado en Supabase
- [ ] Función `stripe-webhook` desplegada
- [ ] Webhook probado y funcionando
- [ ] Eventos apareciendo en Stripe Dashboard
- [ ] Eventos procesándose en Supabase

## 🔗 URLs Útiles

- **Stripe Dashboard (Test):** https://dashboard.stripe.com/test/webhooks
- **Stripe Dashboard (Live):** https://dashboard.stripe.com/webhooks
- **Supabase Dashboard:** https://app.supabase.com
- [Documentación de Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Documentación de Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**¿Necesitas ayuda?** Revisa los logs de Edge Functions y los eventos en Stripe Dashboard para más detalles.
