# 🚀 Setup Rápido del Sistema de Membresías

## Prerrequisitos

- Proyecto Supabase configurado
- Cuenta de Stripe (modo test o producción)
- Variables de entorno configuradas

---

## Paso 1: Aplicar Migración SQL

1. Abre **Supabase Dashboard** → Tu proyecto
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido de:
   ```
   supabase/migrations/001_create_membership_tables.sql
   ```
4. Verifica que las tablas se crearon correctamente:
   - `public.sass_users`
   - `public.sass_subscriptions`
   - `public.sass_webhook_events`

---

## Paso 2: Configurar Variables de Entorno

### En Supabase (Secrets para Edge Functions)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link tu proyecto
supabase link --project-ref tu-project-ref

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**O desde el Dashboard:**
1. Ve a **Project Settings** → **Edge Functions**
2. Agrega los secrets manualmente

### En el Frontend (.env)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID=price_...
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
```

---

## Paso 3: Configurar Webhook en Stripe

1. Ve a **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. URL del endpoint:
   ```
   https://tu-proyecto.supabase.co/functions/v1/stripe-webhook
   ```
4. Selecciona los siguientes eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. Click en **Add endpoint**
6. **Copia el Signing secret** (empieza con `whsec_`)
7. Agrégalo a los secrets de Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Paso 4: Deploy Edge Functions

```bash
# Desde la raíz del proyecto
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy sync-subscription
supabase functions deploy verify-membership
```

**O desde el Dashboard:**
1. Ve a **Edge Functions**
2. Crea cada función manualmente copiando el código

---

## Paso 5: Verificar Configuración

### 1. Verificar Tablas

```sql
-- En SQL Editor de Supabase
SELECT * FROM public.sass_users LIMIT 1;
SELECT * FROM public.sass_subscriptions LIMIT 1;
SELECT * FROM public.sass_webhook_events LIMIT 1;
```

### 2. Verificar RLS

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sass_users', 'sass_subscriptions', 'sass_webhook_events');
```

### 3. Probar Webhook (Opcional)

Usa **Stripe CLI** para testing local:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# o descargar desde https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks a tu función local
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# En otra terminal, trigger un evento de prueba
stripe trigger checkout.session.completed
```

---

## Paso 6: Probar Flujo Completo

### 1. Crear Usuario

- Registra un usuario en tu app
- Verifica que se creó en `public.sass_users`

### 2. Iniciar Checkout

- Navega a `/paywall`
- Click en "Suscribirse"
- Deberías ser redirigido a Stripe Checkout

### 3. Completar Pago (Test)

Usa una tarjeta de prueba de Stripe:
- **Número:** `4242 4242 4242 4242`
- **Fecha:** Cualquier fecha futura
- **CVC:** Cualquier 3 dígitos
- **ZIP:** Cualquier código postal

### 4. Verificar Webhook

1. Ve a **Stripe Dashboard** → **Webhooks**
2. Click en tu webhook
3. Ve a **Events** → Deberías ver `checkout.session.completed`

### 5. Verificar Membresía

- Después del pago, regresa a `/dashboard`
- El estado de membresía debería actualizarse automáticamente
- Verifica en Supabase:
  ```sql
  SELECT * FROM public.sass_subscriptions 
  WHERE user_id = 'tu-user-id';
  ```

---

## Troubleshooting

### Webhook no llega

1. **Verificar URL del webhook:**
   - Debe ser: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
   - Sin trailing slash

2. **Verificar firma:**
   - El `STRIPE_WEBHOOK_SECRET` debe coincidir con el del Dashboard

3. **Verificar logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Stripe Dashboard → Webhooks → Events → Ver detalles

### Usuario no tiene membresía después del pago

1. **Verificar webhook procesado:**
   ```sql
   SELECT * FROM webhook_events 
   WHERE event_type = 'checkout.session.completed' 
   ORDER BY created_at DESC LIMIT 5;
   ```

2. **Sincronizar manualmente:**
   - Usa la función `sync-subscription` desde el frontend
   - O ejecuta manualmente desde el código

3. **Verificar customer_id:**
   ```sql
   SELECT stripe_customer_id FROM users WHERE id = 'tu-user-id';
   ```

### Error "No autorizado" en Edge Functions

1. **Verificar autenticación:**
   - El usuario debe estar autenticado
   - El token debe ser válido

2. **Verificar RLS:**
   - Las políticas deben permitir acceso al usuario

---

## Checklist Final

- [ ] Migración SQL aplicada
- [ ] Tablas creadas correctamente
- [ ] Variables de entorno configuradas
- [ ] Webhook configurado en Stripe
- [ ] Edge Functions deployadas
- [ ] RLS habilitado
- [ ] Flujo de pago probado
- [ ] Webhook procesando eventos
- [ ] Membresía activándose correctamente

---

## Próximos Pasos

1. **Personalizar UI:**
   - Ajustar mensajes de éxito/error
   - Personalizar página de paywall

2. **Agregar Features:**
   - Cancelación de suscripción
   - Cambio de plan
   - Historial de pagos

3. **Monitoreo:**
   - Configurar alertas
   - Revisar logs regularmente
   - Monitorear métricas de conversión

---

## Recursos

- [Documentación Completa](./MEMBERSHIP_SYSTEM.md)
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**¿Problemas?** Revisa los logs de Edge Functions y los eventos de Stripe Dashboard.
