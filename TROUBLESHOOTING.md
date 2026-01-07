# 🔧 Troubleshooting - Sistema de Membresías

## Problema: "No ha guardado en ninguna tabla"

Si después del pago no se guarda nada en las tablas, sigue estos pasos:

---

## ✅ Paso 1: Verificar que las Tablas Existen

Ejecuta en **Supabase SQL Editor**:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'subscriptions', 'webhook_events');
```

**Debe retornar 3 filas.** Si falta alguna, ejecuta la migración completa:

```sql
-- Copia y ejecuta TODO el contenido de:
-- supabase/migrations/001_create_membership_tables.sql
```

---

## ✅ Paso 2: Verificar Variables de Entorno

En **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**, verifica:

- ✅ `STRIPE_SECRET_KEY` está configurado
- ✅ `STRIPE_WEBHOOK_SECRET` está configurado
- ✅ `SUPABASE_SERVICE_ROLE_KEY` está configurado
- ✅ `SUPABASE_URL` está configurado (automático, pero verifica)

---

## ✅ Paso 3: Verificar Webhook en Stripe

1. Ve a **Stripe Dashboard** → **Developers** → **Webhooks**
2. Verifica que el endpoint esté configurado:
   ```
   https://tu-proyecto.supabase.co/functions/v1/stripe-webhook
   ```
3. Verifica que los eventos estén seleccionados:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`

4. **Verifica los logs del webhook:**
   - Click en tu webhook
   - Ve a la pestaña **Events**
   - Busca eventos recientes
   - Click en un evento para ver detalles
   - **Si hay errores, verás el mensaje aquí**

---

## ✅ Paso 4: Verificar Logs de Edge Functions

En **Supabase Dashboard** → **Edge Functions** → **stripe-webhook** → **Logs**:

Busca errores como:
- `Error verificando firma del webhook`
- `Error sincronizando suscripción`
- `No se pudo crear usuario para customer`
- `Faltan variables de entorno`

---

## ✅ Paso 5: Verificar que el Usuario Existe

Ejecuta en **Supabase SQL Editor**:

```sql
-- Verificar usuarios en auth.users vs public.sass_users
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.stripe_customer_id
FROM auth.users au
LEFT JOIN public.sass_users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;
```

**Si `public_user_id` es NULL**, el trigger no está funcionando. Solución:

```sql
-- Verificar que el trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Si no existe, recrearlo:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sass_users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## ✅ Paso 6: Verificar Eventos de Webhook Procesados

Ejecuta:

```sql
SELECT 
  stripe_event_id,
  event_type,
  processed,
  error_message,
  created_at
FROM public.sass_webhook_events
ORDER BY created_at DESC
LIMIT 20;
```

**Si no hay eventos:**
- El webhook no está llegando
- Verifica la URL en Stripe Dashboard
- Verifica que el webhook esté activo

**Si hay eventos con `processed = false` o `error_message`:**
- Revisa el `error_message` para ver qué falló
- Los errores comunes están abajo

---

## ✅ Paso 7: Probar Webhook Manualmente

Usa **Stripe CLI** para enviar un evento de prueba:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Enviar evento de prueba
stripe trigger checkout.session.completed
```

Luego verifica en Supabase si se procesó:

```sql
SELECT * FROM public.sass_webhook_events 
WHERE event_type = 'checkout.session.completed' 
ORDER BY created_at DESC LIMIT 1;
```

---

## 🐛 Errores Comunes y Soluciones

### Error: "relation 'public.sass_users' does not exist"

**Causa:** La tabla `sass_users` no existe.

**Solución:**
```sql
-- Ejecuta la creación de la tabla
CREATE TABLE IF NOT EXISTS public.sass_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Error: "No se pudo crear usuario para customer"

**Causa:** El usuario no existe en `public.sass_users` y el webhook intenta crearlo pero falla.

**Solución:**
1. Verifica que el trigger `on_auth_user_created` existe
2. Si el usuario ya existe en `auth.users`, créalo manualmente:

```sql
INSERT INTO public.sass_users (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.sass_users)
ON CONFLICT (id) DO NOTHING;
```

### Error: "Webhook signature verification failed"

**Causa:** El `STRIPE_WEBHOOK_SECRET` no coincide.

**Solución:**
1. Ve a Stripe Dashboard → Webhooks → Tu webhook
2. Click en **Reveal** en "Signing secret"
3. Copia el secreto
4. Actualiza en Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Error: "Faltan variables de entorno de Supabase"

**Causa:** `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_URL` no están configurados.

**Solución:**
1. Ve a Supabase Dashboard → Project Settings → API
2. Copia el **service_role key** (NO el anon key)
3. Configura el secret:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

### Error: "permission denied for table users"

**Causa:** RLS está bloqueando el acceso (aunque el service role debería bypass).

**Solución:**
Verifica que el webhook use el service role:

```typescript
// En stripe-webhook/index.ts debe estar:
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// NO debe usar la anon key
```

---

## 🔍 Verificación Final

Después de aplicar las correcciones, verifica:

1. **Tablas existen:**
   ```sql
   SELECT COUNT(*) FROM public.sass_users;
   SELECT COUNT(*) FROM public.sass_subscriptions;
   SELECT COUNT(*) FROM public.sass_webhook_events;
   ```

2. **Trigger funciona:**
   - Crea un nuevo usuario de prueba
   - Verifica que se creó en `public.sass_users`

3. **Webhook procesa eventos:**
   - Realiza un pago de prueba
   - Verifica en `webhook_events` que se procesó
   - Verifica en `subscriptions` que se creó la suscripción

---

## 📞 Si el Problema Persiste

1. **Revisa los logs completos:**
   - Supabase Edge Functions logs
   - Stripe Webhook events logs

2. **Ejecuta las queries de diagnóstico:**
   - Usa el archivo `DIAGNOSTIC_QUERIES.sql`

3. **Verifica la configuración completa:**
   - Revisa `MEMBERSHIP_SETUP.md`

4. **Contacta soporte con:**
   - Logs de errores
   - Resultados de las queries de diagnóstico
   - Screenshots de la configuración de Stripe

---

## ✅ Checklist de Verificación

- [ ] Tablas `users`, `subscriptions`, `webhook_events` existen
- [ ] Variables de entorno configuradas en Supabase
- [ ] Webhook configurado en Stripe con URL correcta
- [ ] Eventos seleccionados en Stripe
- [ ] Trigger `on_auth_user_created` existe
- [ ] Usuarios se crean en `public.sass_users` automáticamente
- [ ] Webhook procesa eventos (verificar en `webhook_events`)
- [ ] Suscripciones se crean después del pago
