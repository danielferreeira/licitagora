-- Script para criar um usuário de teste no Supabase
-- Este script deve ser executado no SQL Editor do Supabase

-- Criar um usuário de teste
-- IMPORTANTE: Substitua 'seu_email@exemplo.com' e 'senha_segura' pelos valores desejados
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'admin@licitagora.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Alternativa: Usar a função de criação de usuário do Supabase
-- Esta é a forma recomendada, mas requer permissões de administrador
-- SELECT supabase_auth.create_user(
--   'admin@licitagora.com',
--   'admin123',
--   '{"name":"Administrador"}'::jsonb
-- );

-- Nota: Para criar usuários em produção, é recomendado usar a interface do Supabase
-- ou as APIs de autenticação, não este script SQL direto. 