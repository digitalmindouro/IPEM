-- ============================================================
-- IPEM — Corrigir alertas de segurança do Supabase
-- Execute no SQL Editor do Supabase antes de começar
-- ============================================================

-- As 3 views estão marcadas como SECURITY DEFINER (acesso sem RLS).
-- Abaixo as recriamos como SECURITY INVOKER (respeitam RLS).

-- 1. v_membro_resumo
DROP VIEW IF EXISTS public.v_membro_resumo;
CREATE VIEW public.v_membro_resumo
WITH (security_invoker = true)
AS
  SELECT
    p.id,
    p.nome,
    p.email,
    p.role,
    COUNT(q.id) FILTER (WHERE q.status = 'aprovado') AS cadernos_aprovados,
    MAX(q.numero_caderno) FILTER (WHERE q.status = 'aprovado') AS ultimo_caderno_aprovado,
    t.nome AS turma_nome,
    mt.status AS status_turma
  FROM profiles p
  LEFT JOIN membros_turma mt ON mt.membro_id = p.id AND mt.status = 'ativo'
  LEFT JOIN turmas t ON t.id = mt.turma_id
  LEFT JOIN questionarios q ON q.membro_id = p.id
  GROUP BY p.id, p.nome, p.email, p.role, t.nome, mt.status;

-- 2. v_aprovacoes_pendentes
DROP VIEW IF EXISTS public.v_aprovacoes_pendentes;
CREATE VIEW public.v_aprovacoes_pendentes
WITH (security_invoker = true)
AS
  SELECT
    q.id,
    p.nome AS membro_nome,
    q.numero_caderno,
    q.updated_at AS data_envio,
    mt.turma_id
  FROM questionarios q
  JOIN profiles p ON p.id = q.membro_id
  LEFT JOIN membros_turma mt ON mt.membro_id = q.membro_id AND mt.status = 'ativo'
  WHERE q.status = 'aguardando_aprovacao';

-- 3. v_metricas
DROP VIEW IF EXISTS public.v_metricas;
CREATE VIEW public.v_metricas
WITH (security_invoker = true)
AS
  SELECT
    COUNT(*) FILTER (WHERE role = 'membro')      AS total_membros,
    COUNT(*) FILTER (WHERE role = 'facilitador') AS total_facilitadores,
    COUNT(*) FILTER (WHERE role = 'mentor')      AS total_mentores,
    COUNT(*) FILTER (WHERE role = 'guardiao')    AS total_guardioes,
    (SELECT COUNT(*) FROM turmas WHERE status = 'ativa') AS turmas_ativas,
    (SELECT COUNT(*) FROM questionarios WHERE status = 'aprovado') AS cadernos_aprovados,
    (SELECT COUNT(*) FROM certificados) AS certificados_emitidos
  FROM profiles;

-- ============================================================
-- Verificar se RLS está ativo nas tabelas principais
-- ============================================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_turma ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies básicas (ajuste conforme necessário)
-- ============================================================

-- profiles: usuário vê apenas o próprio perfil (ou role >= mentor vê todos)
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('mentor', 'guardiao', 'ordenista')
    )
  );

-- questionarios: membro vê os próprios; mediadores veem os da sua turma
DROP POLICY IF EXISTS "questionarios_select" ON questionarios;
CREATE POLICY "questionarios_select" ON questionarios
  FOR SELECT USING (
    membro_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM membros_turma mt
      JOIN turmas t ON t.id = mt.turma_id
      WHERE mt.membro_id = questionarios.membro_id
        AND t.responsavel_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('guardiao', 'ordenista')
    )
  );

DROP POLICY IF EXISTS "questionarios_insert" ON questionarios;
CREATE POLICY "questionarios_insert" ON questionarios
  FOR INSERT WITH CHECK (membro_id = auth.uid());

DROP POLICY IF EXISTS "questionarios_update" ON questionarios;
CREATE POLICY "questionarios_update" ON questionarios
  FOR UPDATE USING (membro_id = auth.uid());
