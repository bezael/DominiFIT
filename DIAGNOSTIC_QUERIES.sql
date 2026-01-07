-- ============================================
-- QUERIES DE DIAGNÓSTICO PARA SISTEMA DE MEMBRESÍAS
-- ============================================
-- Ejecuta estas queries en Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar que las tablas existen
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sass_users', 'sass_subscriptions', 'sass_webhook_events')
ORDER BY table_name;

-- 2. Verificar estructura de la tabla users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sass_users'
ORDER BY ordinal_position;

-- 3. Verificar usuarios en auth.users vs public.sass_users
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.stripe_customer_id,
  pu.created_at
FROM auth.users au
LEFT JOIN public.sass_users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Verificar suscripciones existentes
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.stripe_subscription_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.created_at
FROM public.sass_subscriptions s
LEFT JOIN public.sass_users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. Verificar eventos de webhook procesados
SELECT 
  stripe_event_id,
  event_type,
  processed,
  processed_at,
  error_message,
  created_at
FROM public.sass_webhook_events
ORDER BY created_at DESC
LIMIT 20;

-- 6. Verificar errores en webhooks
SELECT 
  stripe_event_id,
  event_type,
  error_message,
  created_at
FROM public.sass_webhook_events
WHERE processed = false
  OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 7. Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  OR (trigger_schema = 'auth' AND trigger_name LIKE '%user%')
ORDER BY trigger_name;

-- 8. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'subscriptions', 'webhook_events')
ORDER BY tablename, policyname;

-- 9. Verificar índices
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'subscriptions', 'webhook_events')
ORDER BY tablename, indexname;

-- 10. Contar registros por tabla
SELECT 
  'sass_users' as tabla,
  COUNT(*) as total
FROM public.sass_users
UNION ALL
SELECT 
  'sass_subscriptions' as tabla,
  COUNT(*) as total
FROM public.sass_subscriptions
UNION ALL
SELECT 
  'sass_webhook_events' as tabla,
  COUNT(*) as total
FROM public.sass_webhook_events;

-- 11. Verificar usuarios sin stripe_customer_id
SELECT 
  id,
  email,
  stripe_customer_id,
  created_at
FROM public.sass_users
WHERE stripe_customer_id IS NULL
ORDER BY created_at DESC;

-- 12. Verificar suscripciones activas
SELECT 
  s.id,
  u.email,
  s.stripe_subscription_id,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end > NOW() THEN 'Válida'
    ELSE 'Expirada'
  END as validez
FROM public.sass_subscriptions s
INNER JOIN public.sass_users u ON s.user_id = u.id
WHERE s.status = 'active'
ORDER BY s.current_period_end DESC;
