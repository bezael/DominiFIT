# 🎯 Sistema Completo de Membresías - Documentación Técnica

## 📋 Tabla de Contenidos

1. [Modelo de Datos en Supabase](#1-modelo-de-datos-en-supabase)
2. [Flujo de Pago (Stripe Checkout)](#2-flujo-de-pago-stripe-checkout)
3. [Webhooks de Stripe (CRÍTICO)](#3-webhooks-de-stripe-crítico)
4. [Sincronización Stripe ↔ Supabase](#4-sincronización-stripe--supabase)
5. [Función `hasActiveMembership(userId)`](#5-función-hasactivemembershipuserid)
6. [Protección de Rutas / Features](#6-protección-de-rutas--features)
7. [Casos Edge y Fallos Comunes](#7-casos-edge-y-fallos-comunes)
8. [Buenas Prácticas de Producción](#8-buenas-prácticas-de-producción)

---

## 1️⃣ Modelo de Datos en Supabase

### Tablas Principales

#### `users` (Extensión de `auth.users`)

Almacena información adicional del usuario relacionada con Stripe.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: UUID del usuario (FK a `auth.users`)
- `email`: Email del usuario (sincronizado desde `auth.users`)
- `stripe_customer_id`: ID del customer en Stripe (único)
- `created_at`, `updated_at`: Timestamps automáticos

**Índices:**
- `idx_users_stripe_customer_id`: Búsqueda rápida por customer_id

#### `subscriptions`

Almacena el estado de las suscripciones de Stripe sincronizadas.

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active', 'trialing', 'past_due', 'canceled', 
    'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  )),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos Clave:**
- `status`: Estado de la suscripción (validado con CHECK constraint)
- `current_period_end`: Fecha de expiración del período actual
- `cancel_at_period_end`: Si es `true`, la suscripción se cancelará al final del período

**Índices Críticos:**
- `idx_subscriptions_user_id`: Búsqueda por usuario
- `idx_subscriptions_stripe_subscription_id`: Búsqueda por subscription_id
- `idx_subscriptions_active_membership`: **Índice parcial optimizado** para verificar membresías activas:
  ```sql
  WHERE status = 'active' AND current_period_end > NOW()
  ```

#### `webhook_events`

Registra eventos de webhook procesados para **idempotencia**.

```sql
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Propósito:**
- Evitar procesar el mismo evento dos veces
- Auditoría de eventos procesados
- Debugging de errores

### Relaciones

```
auth.users (1) ──< (1) public.users (1) ──< (N) public.subscriptions
```

### Row Level Security (RLS)

**Políticas Implementadas:**
- Usuarios solo pueden ver/editar su propio perfil
- Usuarios solo pueden ver su propia suscripción
- `webhook_events` solo accesible por service role

### Funciones SQL Helper

#### `has_active_membership(user_uuid UUID)`

Función SQL que verifica membresía activa desde la base de datos:

```sql
SELECT public.has_active_membership('user-uuid-here');
-- Retorna: true/false
```

---

## 2️⃣ Flujo de Pago (Stripe Checkout)

### Flujo Completo

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ 1. Click "Suscribirse"
       ▼
┌─────────────────────────┐
│   Frontend (Paywall)     │
│   - Obtiene userId       │
│   - Llama createCheckout │
└──────┬──────────────────┘
       │ 2. POST /create-checkout-session
       ▼
┌──────────────────────────────┐
│   Edge Function              │
│   create-checkout-session    │
│   - Obtiene/crea customer    │
│   - Crea checkout session    │
└──────┬───────────────────────┘
       │ 3. Retorna URL de checkout
       ▼
┌──────────────────────────────┐
│   Stripe Checkout            │
│   - Usuario paga             │
│   - Stripe procesa pago      │
└──────┬───────────────────────┘
       │ 4. Redirección a success_url
       ▼
┌──────────────────────────────┐
│   Frontend (Dashboard)      │
│   - Recibe session_id        │
│   - Espera webhook           │
│   - Refresca membresía       │
└──────────────────────────────┘
       │
       │ 5. Stripe emite webhook
       ▼
┌──────────────────────────────┐
│   Edge Function              │
│   stripe-webhook             │
│   - Verifica firma           │
│   - Procesa evento           │
│   - Actualiza Supabase       │
└──────────────────────────────┘
```

### Datos del Frontend vs Backend

#### ✅ **Del Frontend (Seguro):**
- `userId`: ID del usuario autenticado
- `priceId`: ID del precio de Stripe (puede estar en env vars)
- `successUrl`, `cancelUrl`: URLs de redirección

#### ❌ **NUNCA del Frontend:**
- Estado de suscripción
- `stripe_customer_id`
- `stripe_subscription_id`
- Cualquier dato de pago

### Edge Function: `create-checkout-session`

**Responsabilidades:**
1. Verificar autenticación del usuario
2. Obtener o crear `stripe_customer_id`
3. Crear sesión de checkout con `customer` vinculado
4. Retornar URL de checkout

**Código Clave:**
```typescript
// Obtener o crear customer
const customerId = await getOrCreateStripeCustomer(userId, email);

// Crear sesión con customer vinculado
const session = await stripe.checkout.sessions.create({
  customer: customerId, // ← CRÍTICO: Vincula el pago al usuario
  // ... resto de configuración
});
```

---

## 3️⃣ Webhooks de Stripe (CRÍTICO)

### ¿Por qué son Críticos?

Los webhooks son la **única fuente confiable** de eventos de Stripe. El frontend **NUNCA** debe confiar en que un pago fue exitoso basándose solo en la redirección.

### Eventos Manejados

| Evento | Descripción | Acción |
|--------|-------------|--------|
| `checkout.session.completed` | Checkout completado | Crear/actualizar suscripción |
| `customer.subscription.created` | Suscripción creada | Sincronizar suscripción |
| `customer.subscription.updated` | Suscripción actualizada | Actualizar estado en Supabase |
| `customer.subscription.deleted` | Suscripción cancelada | Marcar como `canceled` |
| `invoice.payment_failed` | Pago fallido | Cambiar estado a `past_due` |

### Edge Function: `stripe-webhook`

#### Verificación de Firma

**CRÍTICO:** Siempre verificar la firma del webhook:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

**¿Por qué?**
- Previene ataques de webhooks falsos
- Asegura que el evento viene de Stripe
- Requisito de seguridad de Stripe

#### Idempotencia

Cada evento se registra en `webhook_events` antes de procesarlo:

```typescript
// Verificar si ya fue procesado
if (await isEventProcessed(event.id)) {
  return; // Ignorar evento duplicado
}

// Procesar evento
await processStripeEvent(event);

// Marcar como procesado
await markEventAsProcessed(event.id, event.type, payload);
```

**Beneficios:**
- Evita procesar el mismo evento dos veces
- Permite re-procesar eventos fallidos
- Auditoría completa

### Configuración en Stripe Dashboard

1. Ir a **Developers → Webhooks**
2. Agregar endpoint: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copiar **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Testing de Webhooks

#### Usando Stripe CLI (Recomendado)

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a localhost
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger evento de prueba
stripe trigger checkout.session.completed
```

#### Usando Stripe Dashboard

1. Ir a **Developers → Webhooks**
2. Click en el webhook
3. **Send test webhook**
4. Seleccionar evento y enviar

---

## 4️⃣ Sincronización Stripe ↔ Supabase

### Fuente de la Verdad

**Stripe es la fuente de la verdad** para:
- Estado de suscripción
- Fechas de período
- Cancelaciones
- Pagos

**Supabase es la caché optimizada** para:
- Consultas rápidas desde el frontend
- Verificaciones de acceso
- UI/UX

### Cuándo Consultar Stripe Directamente

✅ **Sí, consultar Stripe cuando:**
- Hay inconsistencia detectada
- Usuario reporta problema
- Verificación manual desde admin
- Sincronización forzada

❌ **No, usar Supabase cuando:**
- Verificación rutinaria de acceso
- UI del dashboard
- Protección de rutas
- Features premium

### Función de Sincronización

```typescript
// Desde el frontend (requiere Edge Function)
await syncSubscriptionWithStripe(subscriptionId);

// La Edge Function consulta Stripe y actualiza Supabase
```

### Cron Job Opcional (Futuro)

Para verificar inconsistencias periódicamente:

```typescript
// Edge Function: sync-all-subscriptions
// Ejecutar diariamente vía cron
// Compara Stripe vs Supabase y sincroniza diferencias
```

---

## 5️⃣ Función `hasActiveMembership(userId)`

### Implementación

#### Frontend (TypeScript)

```typescript
import { hasActiveMembership } from '@/lib/membership';

const isActive = await hasActiveMembership();
// o
const isActive = await hasActiveMembership(userId);
```

**Lógica:**
1. Consulta `subscriptions` en Supabase
2. Filtra por:
   - `status = 'active'`
   - `current_period_end > NOW()`
   - `cancel_at_period_end = false`
3. Retorna `true` si existe

#### Backend (SQL)

```sql
SELECT public.has_active_membership('user-uuid');
```

### Casos Edge

#### 1. Suscripción en Trial

```typescript
const status = await getMembershipStatus();
if (status.isTrialing) {
  // Permitir acceso durante trial
}
```

#### 2. Cancelada pero Activa hasta Fin de Período

```typescript
if (status.willCancelAtPeriodEnd) {
  // Mostrar mensaje: "Tu membresía expira el X"
}
```

#### 3. Verificación con Stripe (Fallback)

```typescript
// Si hay duda, verificar con Stripe
const verified = await verifyMembershipWithStripe(subscriptionId);
```

### Hook React: `useMembership`

```tsx
const { 
  hasActiveMembership, 
  membershipStatus, 
  loading,
  refresh 
} = useMembership();

if (loading) return <Loading />;
if (hasActiveMembership) {
  return <PremiumFeatures />;
}
```

**Características:**
- Auto-refresh al montar
- Escucha cambios en tiempo real (opcional con Realtime)
- Estado completo de membresía
- Manejo de errores

---

## 6️⃣ Protección de Rutas / Features

### Componente: `ProtectedRoute`

#### Uso Básico (Solo Autenticación)

```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

#### Con Requisito de Membresía

```tsx
<ProtectedRoute 
  requireMembership={true}
  membershipRedirectTo="/paywall"
>
  <PremiumFeatures />
</ProtectedRoute>
```

### Protección de Features

#### Opción 1: Componente Condicional

```tsx
const { hasActiveMembership } = useMembership();

{hasActiveMembership ? (
  <PremiumFeature />
) : (
  <UpgradePrompt />
)}
```

#### Opción 2: Hook Personalizado

```tsx
function usePremiumFeature() {
  const { hasActiveMembership } = useMembership();
  
  if (!hasActiveMembership) {
    throw new Error('Feature premium requerida');
  }
  
  return { /* feature data */ };
}
```

### Protección de Endpoints Backend

#### Edge Function Example

```typescript
// Verificar membresía antes de procesar
const { data: { user } } = await supabase.auth.getUser();
const hasMembership = await hasActiveMembership(user.id);

if (!hasMembership) {
  return new Response(
    JSON.stringify({ error: 'Membresía requerida' }),
    { status: 403 }
  );
}
```

---

## 7️⃣ Casos Edge y Fallos Comunes

### 1. Usuario Paga pero Cierra la Ventana

**Problema:** El webhook puede llegar antes de que el usuario regrese.

**Solución:**
- El webhook procesa el evento independientemente
- Al regresar, el frontend verifica membresía
- Si no está activa, intenta sincronizar manualmente

```typescript
// En Dashboard después de checkout
if (sessionId) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await refreshMembership();
  
  if (!hasActiveMembership && subscription) {
    await syncSubscriptionWithStripe(subscription.stripe_subscription_id);
  }
}
```

### 2. Webhook No Llega

**Causas:**
- Endpoint incorrecto
- Firma inválida
- Timeout del servidor
- Firewall bloqueando

**Solución:**
- Verificar logs de Stripe Dashboard
- Usar Stripe CLI para testing local
- Implementar retry logic en webhook
- Sincronización manual como fallback

### 3. Pago Fallido en Renovación

**Evento:** `invoice.payment_failed`

**Acción Automática:**
- Estado cambia a `past_due`
- Usuario mantiene acceso durante grace period
- Stripe reintenta el pago automáticamente

**Manejo:**
```typescript
// Mostrar advertencia al usuario
if (status === 'past_due') {
  showPaymentFailedWarning();
}
```

### 4. Usuario Cancela pero Sigue Activo hasta Fin de Período

**Comportamiento Esperado:**
- `cancel_at_period_end = true`
- `status = 'active'` hasta `current_period_end`
- Después de `current_period_end`: `status = 'canceled'`

**Verificación:**
```typescript
const status = await getMembershipStatus();
if (status.willCancelAtPeriodEnd) {
  // Mostrar: "Tu membresía expira el X"
}
```

### 5. Usuario Intenta Acceder sin Membresía

**Protección:**
```tsx
<ProtectedRoute requireMembership={true}>
  <PremiumContent />
</ProtectedRoute>
```

**UX:**
- Redirigir a `/paywall`
- Mostrar mensaje claro
- Ofrecer suscripción

### 6. Doble Suscripción Accidental

**Prevención:**
- Verificar suscripción existente antes de crear checkout
- En checkout, usar `customer` existente
- Stripe previene múltiples suscripciones activas del mismo customer

**Detección:**
```typescript
// Antes de crear checkout
const existing = await getCurrentSubscription(userId);
if (existing && existing.status === 'active') {
  // Mostrar: "Ya tienes una suscripción activa"
  return;
}
```

### 7. Inconsistencias entre Stripe y Supabase

**Detección:**
- Comparar `status` y `current_period_end`
- Verificar en logs de webhooks

**Solución:**
```typescript
// Sincronización manual
await syncSubscriptionWithStripe(subscriptionId);
```

---

## 8️⃣ Buenas Prácticas de Producción

### Seguridad

#### ✅ **Hacer:**
- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en Edge Functions
- Verificar firma de webhooks siempre
- Validar `userId` en todas las funciones
- Usar RLS en todas las tablas
- Nunca exponer `STRIPE_SECRET_KEY` al frontend

#### ❌ **No Hacer:**
- Confiar en datos del frontend para estados de pago
- Procesar webhooks sin verificar firma
- Exponer service role key al cliente
- Deshabilitar RLS "temporalmente"

### Logs y Auditoría

#### Logs Importantes

```typescript
// En webhook
console.log(`Evento recibido: ${event.type} (${event.id})`);
console.log(`Suscripción ${subscriptionId} sincronizada`);

// En checkout
console.log(`Checkout creado para usuario ${userId}`);
console.log(`Customer ID: ${customerId}`);
```

#### Tabla de Auditoría

La tabla `webhook_events` actúa como auditoría:
- Qué eventos se procesaron
- Cuándo se procesaron
- Si hubo errores
- Payload completo

### Testing

#### Testing Local

1. **Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

2. **Test Cards:**
   - `4242 4242 4242 4242` - Pago exitoso
   - `4000 0000 0000 0002` - Pago rechazado

3. **Test Webhooks:**
   ```bash
   stripe trigger checkout.session.completed
   ```

#### Testing en Producción

- Usar modo test de Stripe primero
- Verificar webhooks en Stripe Dashboard
- Monitorear logs de Edge Functions
- Probar flujo completo end-to-end

### Entornos

#### Variables de Entorno

**Frontend (.env):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
```

**Backend (Supabase Secrets):**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Separación Dev/Prod

- Usar diferentes proyectos de Stripe
- Diferentes webhooks para dev/prod
- Variables de entorno por entorno

### Migraciones de Esquema

#### Aplicar Migraciones

```bash
# Local
supabase migration up

# Producción (via Supabase Dashboard)
# SQL Editor → Ejecutar migración
```

#### Versionado

- Una migración por cambio
- Nombres descriptivos: `001_create_membership_tables.sql`
- Reversibles cuando sea posible

### Escalabilidad Futura

#### Planes Múltiples

```typescript
// Agregar campo plan_id a subscriptions
// Crear tabla plans con precios
// Modificar checkout para seleccionar plan
```

#### Upgrades/Downgrades

```typescript
// Usar Stripe Subscription Schedules
// O cancelar y crear nueva suscripción
```

#### Períodos de Trial

```typescript
// Ya soportado: status = 'trialing'
// Verificar en hasActiveMembership
```

#### Descuentos y Cupones

```typescript
// Agregar discount_code a checkout session
// Stripe maneja automáticamente
```

### Monitoreo

#### Métricas Clave

- Tasa de conversión (checkout → activo)
- Tiempo de procesamiento de webhooks
- Errores de webhook
- Inconsistencias detectadas

#### Alertas

- Webhook fallando repetidamente
- Suscripciones sin sincronizar
- Errores en checkout

---

## 🚀 Setup Rápido

### 1. Aplicar Migración SQL

```bash
# En Supabase Dashboard → SQL Editor
# Ejecutar: supabase/migrations/001_create_membership_tables.sql
```

### 2. Configurar Variables de Entorno

```bash
# Supabase Secrets
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Configurar Webhook en Stripe

1. Dashboard → Developers → Webhooks
2. Agregar endpoint: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
3. Seleccionar eventos
4. Copiar signing secret

### 4. Deploy Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 5. Probar Flujo Completo

1. Crear usuario
2. Iniciar checkout
3. Completar pago (test card)
4. Verificar webhook procesado
5. Verificar membresía activa

---

## 📚 Referencias

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist de Producción

- [ ] Migración SQL aplicada
- [ ] Variables de entorno configuradas
- [ ] Webhook configurado en Stripe
- [ ] Edge Functions deployadas
- [ ] RLS habilitado y probado
- [ ] Testing end-to-end completado
- [ ] Logs configurados
- [ ] Monitoreo activo
- [ ] Documentación actualizada
- [ ] Plan de rollback preparado

---

**Última actualización:** 2024
**Versión:** 1.0.0
