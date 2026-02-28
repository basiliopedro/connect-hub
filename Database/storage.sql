-- ============================================================
-- SUPABASE STORAGE — configuração dos buckets
-- Executa no SQL Editor do Supabase após o schema.sql
-- ============================================================

-- Bucket: avatars (público — URLs directas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- público
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: documents (privado — requer signed URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- privado
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: portfolios (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;


-- ── Políticas de Storage ─────────────────────────────────────

-- AVATARS: qualquer utilizador autenticado pode fazer upload do seu avatar
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- AVATARS: leitura pública
CREATE POLICY "avatar_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- DOCUMENTS: apenas o próprio utilizador faz upload
CREATE POLICY "documents_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- DOCUMENTS: utilizador vê os seus próprios documentos
CREATE POLICY "documents_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- DOCUMENTS: admin vê todos os documentos
CREATE POLICY "documents_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PORTFOLIOS: upload por autenticados
CREATE POLICY "portfolios_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolios');

-- PORTFOLIOS: leitura pública
CREATE POLICY "portfolios_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolios');
