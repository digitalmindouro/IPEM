export type Role = 'membro' | 'facilitador' | 'mentor' | 'guardiao' | 'ordenista'

export const ROLE_LABEL: Record<Role, string> = {
  membro: 'Membro', facilitador: 'Facilitador', mentor: 'Mentor', guardiao: 'Guardião', ordenista: 'Ordenista',
}

export type CadernoNumero = 1 | 2 | 3 | 4

export const CADERNO_INFO: Record<CadernoNumero, { letra: string; nome: string; descricao: string }> = {
  1: { letra: 'I', nome: 'Intelecto', descricao: 'Identidade, clareza mental, governo dos próprios pensamentos e decisões.' },
  2: { letra: 'P', nome: 'Profissional', descricao: 'Serviço, dignidade no trabalho, transformação de talento em solução real.' },
  3: { letra: 'E', nome: 'Emocional', descricao: 'Valores, estrutura interna, ritmo sustentável, coerência.' },
  4: { letra: 'M', nome: 'Movimento', descricao: 'Impacto, legado, posicionamento, construção de relações sólidas.' },
}

export type StatusCaderno = 'bloqueado' | 'disponivel' | 'em_andamento' | 'aguardando_aprovacao' | 'aprovado' | 'ajustar' | 'reaplicar'
export type StatusTurma = 'pendente' | 'ativa' | 'encerrada'
export type DecisaoAprovacao = 'aprovado' | 'ajustar' | 'reaplicar'

export interface Profile {
  id: string
  email: string
  nome: string
  role: Role
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Questionario {
  id: string
  membro_id: string
  turma_id: string
  numero_caderno: CadernoNumero
  respostas: Record<string, unknown>
  status: StatusCaderno
  data_conclusao?: string
  created_at: string
  updated_at: string
}

export function canValidate(role: Role): boolean {
  return ['facilitador', 'mentor', 'guardiao', 'ordenista'].includes(role)
}

export function canCreateTurma(role: Role): boolean {
  return ['mentor', 'guardiao', 'ordenista'].includes(role)
}

export function proximoCaderno(atual: CadernoNumero | null): CadernoNumero | null {
  if (atual === null) return 1
  if (atual === 4) return null
  return (atual + 1) as CadernoNumero
}
