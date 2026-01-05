# Solución Rápida: Error "Failed to fetch"

El error "Failed to fetch" ocurre porque el endpoint del backend no está disponible. Sigue estos pasos para solucionarlo:

## Opción 1: Usar Supabase Edge Functions (Recomendado)

### Paso 1: Instalar Supabase CLI
```bash
npm install -g supabase
```

### Paso 2: Iniciar sesión
```bash
supabase login
```

### Paso 3: Vincular tu proyecto
```bash
supabase link --project-ref tu-project-ref
```
Encuentra tu `project-ref` en la URL de tu proyecto Supabase: `https://app.supabase.com/project/tu-project-ref`

### Paso 4: Configurar el secreto de Stripe
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
```
Obtén tu clave secreta de: https://dashboard.stripe.com/test/apikeys

### Paso 5: Desplegar la función
```bash
supabase functions deploy create-checkout-session
```

### Paso 6: Verificar variables en .env
Asegúrate de tener estas variables en tu `.env`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica
VITE_STRIPE_PRICE_ID=price_tu_price_id
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key
```

## Opción 2: Desarrollo Local (Para probar)

Si quieres probar localmente antes de desplegar:

```bash
# Iniciar Supabase localmente
supabase start

# Servir la función localmente
supabase functions serve create-checkout-session --env-file .env.local
```

Luego actualiza tu `.env` con:
```env
VITE_API_URL=http://localhost:54321/functions/v1
```

## Verificar que funciona

1. Asegúrate de que todas las variables estén en tu `.env`
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Intenta hacer clic en "Probar Premium" en la página de Paywall

Si aún tienes problemas, verifica:
- ✅ Que la función esté desplegada: `supabase functions list`
- ✅ Que el secreto esté configurado: `supabase secrets list`
- ✅ Que las variables de entorno estén correctas en `.env`
- ✅ Que el navegador no esté bloqueando CORS (revisa la consola)

## Notas

- La función ya está creada en `supabase/functions/create-checkout-session/index.ts`
- El código del frontend ya está configurado para usar Supabase Edge Functions automáticamente
- No necesitas configurar `VITE_API_URL` si usas Supabase Edge Functions (se detecta automáticamente)
