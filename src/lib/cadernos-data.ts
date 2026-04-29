import type { CadernoNumero } from '@/types'

export interface Campo {
  id: string
  tipo: 'textarea' | 'text' | 'slider' | 'select' | 'radio' | 'declaracao'
  label: string
  placeholder?: string
  opcoes?: string[]
  min?: number
  max?: number
  obrigatorio?: boolean
}

export interface Ferramenta {
  id: string
  titulo: string
  subtitulo?: string
  descricao?: string
  citacao?: string
  campos: Campo[]
}

export interface CadernoData {
  numero: CadernoNumero
  letra: string
  nome: string
  subtitulo: string
  citacao: string
  cor: string
  ferramentas: Ferramenta[]
}

export const CADERNOS_DATA: Record<CadernoNumero, CadernoData> = {
  1: {
    numero: 1,
    letra: 'I',
    nome: 'Intelecto',
    subtitulo: 'Identidade, clareza mental, governo dos próprios pensamentos.',
    citacao: 'Antes de mudar a vida, eu encaro a minha vida.',
    cor: 'amber',
    ferramentas: [
      {
        id: 'roda_vida',
        titulo: 'Roda da Vida',
        subtitulo: 'Onde você está de verdade.',
        descricao: 'Não avalie pelo que você quer ser. Avalie pelo que você vive. De 0 a 10 — 0 é colapso, 10 é excelência sustentável.',
        campos: [
          { id: 'roda_saude', tipo: 'slider', label: 'Saúde e Corpo', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_financas', tipo: 'slider', label: 'Finanças', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_relacionamentos', tipo: 'slider', label: 'Relacionamentos', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_profissional', tipo: 'slider', label: 'Vida Profissional', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_proposito', tipo: 'slider', label: 'Propósito / Espiritualidade', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_lazer', tipo: 'slider', label: 'Lazer e Descanso', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_familia', tipo: 'slider', label: 'Família', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_desenvolvimento', tipo: 'slider', label: 'Desenvolvimento Pessoal', min: 0, max: 10, obrigatorio: true },
          { id: 'roda_area_fraca', tipo: 'text', label: 'Minha área mais fraca é:', placeholder: 'Qual área está mais baixa?', obrigatorio: true },
          { id: 'roda_area_forte', tipo: 'text', label: 'Minha área mais forte é:', placeholder: 'Qual área está melhor?', obrigatorio: true },
          { id: 'roda_sabota', tipo: 'text', label: 'A área que mais me sabota é:', placeholder: 'Qual te impede de avançar?', obrigatorio: true },
          { id: 'roda_finjo', tipo: 'text', label: 'A área que finjo que está bem é:', placeholder: 'Seja honesto.', obrigatorio: true },
        ],
      },
      {
        id: 'area_mestra',
        titulo: 'Área Mestra',
        subtitulo: 'Próximos 30 dias.',
        citacao: 'Se eu organizasse só uma área agora, qual destravaria o resto?',
        campos: [
          { id: 'area_mestra_escolha', tipo: 'text', label: 'Minha Área Mestra para os próximos 30 dias:', placeholder: 'Uma área só. Qual?', obrigatorio: true },
          { id: 'area_mestra_justificativa', tipo: 'textarea', label: 'Por que essa área destrava o resto?', placeholder: 'Explique sua lógica...', obrigatorio: true },
        ],
      },
      {
        id: 'dump_mental',
        titulo: 'Dump Mental',
        subtitulo: 'Tire o que está pesando.',
        descricao: 'Escreva tudo que está na sua cabeça. Sem organizar, sem julgar, sem censura. A única regra é não parar no meio.',
        campos: [
          { id: 'dump_texto', tipo: 'textarea', label: 'Tudo que está na minha cabeça agora:', placeholder: 'Escreva tudo. Pensamentos, preocupações, desejos, medos, tarefas, planos... Não pare.', obrigatorio: true },
          { id: 'dump_urgente', tipo: 'textarea', label: 'O que é urgente (precisa ser resolvido logo):', placeholder: 'Liste o que não pode esperar...', obrigatorio: true },
          { id: 'dump_importante', tipo: 'textarea', label: 'O que é importante (impacta o futuro):', placeholder: 'Liste o que importa mas não é urgente...', obrigatorio: false },
          { id: 'dump_desapegar', tipo: 'textarea', label: 'O que posso delegar ou desapegar:', placeholder: 'O que você carrega mas não precisa ser você...', obrigatorio: false },
        ],
      },
      {
        id: 'criterio_decisao',
        titulo: 'Critério de Decisão',
        subtitulo: 'Pare de decidir no impulso.',
        citacao: 'Isso me aproxima ou me afasta da minha Área Mestra?',
        descricao: 'Para cada decisão importante, aplique o filtro abaixo. Ele existe para te impedir de sair da Área Mestra.',
        campos: [
          { id: 'decisao_atual', tipo: 'textarea', label: 'Qual decisão importante você está enfrentando agora?', placeholder: 'Descreva a decisão...', obrigatorio: true },
          { id: 'decisao_aproxima', tipo: 'radio', label: 'Essa decisão me aproxima da minha Área Mestra?', opcoes: ['Sim, claramente', 'Talvez', 'Não'], obrigatorio: true },
          { id: 'decisao_valores', tipo: 'radio', label: 'Essa decisão respeita meus valores?', opcoes: ['Sim', 'Parcialmente', 'Não'], obrigatorio: true },
          { id: 'decisao_conclusao', tipo: 'textarea', label: 'Minha conclusão sobre essa decisão:', placeholder: 'Após o filtro, o que você decide?', obrigatorio: true },
        ],
      },
      {
        id: 'plano_concentracao',
        titulo: 'Plano de Concentração',
        subtitulo: '30 dias. Uma direção.',
        descricao: 'Dispersão é o maior inimigo da construção. Declare onde você vai colocar sua energia — e o que vai pausar pra isso.',
        campos: [
          { id: 'foco_declaracao', tipo: 'textarea', label: 'Declaração de Foco — próximos 30 dias (máximo 3 itens):', placeholder: 'No que vou colocar minha energia? Seja específico.', obrigatorio: true },
          { id: 'foco_renuncias', tipo: 'textarea', label: 'Renúncias — o que vou pausar para honrar esse foco:', placeholder: 'O que você vai parar de fazer?', obrigatorio: true },
        ],
      },
      {
        id: 'revisao_mensal',
        titulo: 'Revisão Mensal',
        subtitulo: 'Aprendizado consciente.',
        descricao: 'Após 30 dias, sente e responda com honestidade. Sem essa etapa, o crescimento vira ilusão.',
        campos: [
          { id: 'revisao_evitei', tipo: 'textarea', label: 'O que continuei evitando?', placeholder: 'O que você prometeu encarar mas não encarou?', obrigatorio: true },
          { id: 'revisao_decisao', tipo: 'textarea', label: 'Que decisão mudou meu jogo?', placeholder: 'Qual foi a decisão mais importante do período?', obrigatorio: true },
          { id: 'revisao_aprendizado', tipo: 'textarea', label: 'O maior aprendizado do mês foi:', placeholder: 'O que você leva desse ciclo?', obrigatorio: true },
        ],
      },
      {
        id: 'evidencias',
        titulo: 'Evidências',
        subtitulo: 'Sem prova, não existiu.',
        citacao: 'O que prova que eu mudei?',
        descricao: 'O Caderno I só está concluído quando tem evidência real. O método não aceita autoengano.',
        campos: [
          { id: 'evidencia_mudanca', tipo: 'textarea', label: 'O que prova concretamente que você mudou?', placeholder: 'Descreva comportamentos, resultados, decisões diferentes...', obrigatorio: true },
          { id: 'evidencia_antes_depois', tipo: 'textarea', label: 'Como você era antes vs como está agora:', placeholder: 'Antes: ...\nAgora: ...', obrigatorio: true },
        ],
      },
    ],
  },

  2: {
    numero: 2,
    letra: 'P',
    nome: 'Profissional',
    subtitulo: 'Serviço, dignidade no trabalho, transformação de talento em solução.',
    citacao: 'Trabalho não é o que você faz. É o que você resolve para o mundo.',
    cor: 'blue',
    ferramentas: [
      {
        id: 'diagnostico_habilidades',
        titulo: 'Diagnóstico de Habilidades',
        subtitulo: 'O que você tem de verdade.',
        descricao: 'Antes de decidir o que oferecer, entenda o que você já possui. Talento não declarado é talento desperdiçado.',
        campos: [
          { id: 'hab_naturais', tipo: 'textarea', label: 'O que você faz com facilidade que outros acham difícil?', placeholder: 'Habilidades naturais, mesmo que pareçam simples...', obrigatorio: true },
          { id: 'hab_aprendi', tipo: 'textarea', label: 'O que você aprendeu e domina?', placeholder: 'Cursos, experiências, conhecimentos adquiridos...', obrigatorio: true },
          { id: 'hab_resultados', tipo: 'textarea', label: 'Que resultados concretos você já gerou para alguém?', placeholder: 'Exemplos reais. Não teóricos.', obrigatorio: true },
          { id: 'hab_principal', tipo: 'text', label: 'Minha habilidade principal (uma só):', placeholder: 'Se você pudesse escolher uma, qual seria?', obrigatorio: true },
        ],
      },
      {
        id: 'proposito_profissional',
        titulo: 'Propósito Profissional',
        subtitulo: 'Por que você trabalha de verdade.',
        citacao: 'Propósito não é poesia. É a razão que te faz continuar quando está difícil.',
        campos: [
          { id: 'prop_problema', tipo: 'textarea', label: 'Que problema do mundo te incomoda profundamente?', placeholder: 'O que você vê que poderia ser melhor?', obrigatorio: true },
          { id: 'prop_solucao', tipo: 'textarea', label: 'Como sua habilidade pode resolver esse problema?', placeholder: 'A conexão entre o que você tem e o que o mundo precisa...', obrigatorio: true },
          { id: 'prop_declaracao', tipo: 'textarea', label: 'Minha declaração de propósito profissional:', placeholder: 'Eu ajudo [quem] a [resultado] através de [como].', obrigatorio: true },
        ],
      },
      {
        id: 'cliente_ideal',
        titulo: 'Cliente / Pessoa que Você Serve',
        subtitulo: 'Para quem é o seu trabalho.',
        descricao: 'Você não serve todo mundo. Quanto mais específico for sobre quem você ajuda, mais impacto você gera.',
        campos: [
          { id: 'cliente_quem', tipo: 'textarea', label: 'Quem é a pessoa que você quer ajudar?', placeholder: 'Descreva: situação de vida, dores, desejos, contexto...', obrigatorio: true },
          { id: 'cliente_dor', tipo: 'textarea', label: 'Qual é a maior dor ou problema dessa pessoa?', placeholder: 'O que tira o sono dela?', obrigatorio: true },
          { id: 'cliente_resultado', tipo: 'textarea', label: 'Qual resultado concreto você entrega para ela?', placeholder: 'Não o processo — o resultado final.', obrigatorio: true },
        ],
      },
      {
        id: 'oferta_real',
        titulo: 'Oferta Real',
        subtitulo: 'Transforme talento em solução.',
        descricao: 'Uma oferta clara não é uma lista de serviços. É uma promessa de transformação.',
        campos: [
          { id: 'oferta_o_que', tipo: 'textarea', label: 'O que exatamente você oferece?', placeholder: 'Descreva seu serviço ou produto de forma simples...', obrigatorio: true },
          { id: 'oferta_como', tipo: 'textarea', label: 'Como funciona? (passo a passo básico)', placeholder: '1. ...\n2. ...\n3. ...', obrigatorio: true },
          { id: 'oferta_prova', tipo: 'textarea', label: 'Que prova você tem de que isso funciona?', placeholder: 'Resultados anteriores, casos reais, depoimentos...', obrigatorio: true },
          { id: 'oferta_preco', tipo: 'text', label: 'Valor cobrado (ou pretendido):', placeholder: 'R$ ...', obrigatorio: false },
        ],
      },
      {
        id: 'dignidade_trabalho',
        titulo: 'Dignidade no Trabalho',
        subtitulo: 'Trabalhar sem perder o caráter.',
        citacao: 'Nenhum resultado justifica a quebra dos princípios.',
        campos: [
          { id: 'dig_limites', tipo: 'textarea', label: 'Que tipo de trabalho ou cliente você não aceita?', placeholder: 'Seus limites profissionais...', obrigatorio: true },
          { id: 'dig_valores', tipo: 'textarea', label: 'Como seus valores se refletem no seu trabalho?', placeholder: 'Conexão entre quem você é e como você trabalha...', obrigatorio: true },
          { id: 'dig_legado', tipo: 'textarea', label: 'Que legado profissional você quer deixar?', placeholder: 'Como você quer ser lembrado pelo seu trabalho?', obrigatorio: true },
        ],
      },
      {
        id: 'evidencias_p',
        titulo: 'Evidências',
        subtitulo: 'Sem prova, não existiu.',
        citacao: 'O que prova que eu sirvo de verdade?',
        campos: [
          { id: 'evid_p_resultado', tipo: 'textarea', label: 'Qual resultado concreto você gerou nesse caderno?', placeholder: 'Um cliente atendido, uma oferta testada, um feedback recebido...', obrigatorio: true },
          { id: 'evid_p_aprendizado', tipo: 'textarea', label: 'O maior aprendizado profissional desse ciclo:', placeholder: 'O que mudou na forma como você vê seu trabalho?', obrigatorio: true },
        ],
      },
    ],
  },

  3: {
    numero: 3,
    letra: 'E',
    nome: 'Emocional',
    subtitulo: 'Valores, estrutura interna, ritmo sustentável.',
    citacao: 'Crescer sem perder a alma é a verdadeira vitória.',
    cor: 'emerald',
    ferramentas: [
      {
        id: 'consciencia_ritmo',
        titulo: 'Consciência de Ritmo',
        subtitulo: 'Onde você realmente está.',
        descricao: 'Toda meta que falhou começou com uma expectativa irreal. Antes de planejar o que vai mudar, encare o que existe.',
        campos: [
          { id: 'ritmo_tempo_livre', tipo: 'slider', label: 'Quanto tempo livre tenho por dia (horas)?', min: 0, max: 12, obrigatorio: true },
          { id: 'ritmo_cansaco', tipo: 'slider', label: 'Nível de cansaço atual (0 = esgotado, 10 = pleno):', min: 0, max: 10, obrigatorio: true },
          { id: 'ritmo_tentei_abandonei', tipo: 'textarea', label: 'O que eu já tentei e abandonei:', placeholder: 'Hábitos, metas, projetos que não sustentei...', obrigatorio: true },
          { id: 'ritmo_vida_real', tipo: 'textarea', label: 'Minha vida como ela é de verdade (sem filtro):', placeholder: 'Como são seus dias na realidade?', obrigatorio: true },
        ],
      },
      {
        id: 'raio_x_rotina',
        titulo: 'Raio-X da Rotina',
        subtitulo: 'Pare de fingir.',
        descricao: 'Você não pode construir uma nova rotina sem encarar a atual. Mapeie o que de fato acontece nos seus dias.',
        campos: [
          { id: 'rotina_acorda', tipo: 'text', label: 'Que horas você acorda normalmente?', placeholder: 'Ex: 7h30', obrigatorio: true },
          { id: 'rotina_tela', tipo: 'slider', label: 'Tempo de tela/celular por dia (horas):', min: 0, max: 16, obrigatorio: true },
          { id: 'rotina_fadiga', tipo: 'slider', label: 'Nível de fadiga geral (0 = exausto, 10 = ótimo):', min: 0, max: 10, obrigatorio: true },
          { id: 'rotina_diz', tipo: 'textarea', label: 'O que essa rotina diz sobre mim?', placeholder: 'O que seus hábitos revelam sobre suas prioridades reais?', obrigatorio: true },
        ],
      },
      {
        id: 'valores_limites',
        titulo: 'Valores e Limites',
        subtitulo: 'Crescer sem se trair.',
        citacao: 'Você pode chegar longe e chegar errado.',
        campos: [
          { id: 'valores_escolha', tipo: 'textarea', label: 'Meus 3 a 5 valores reais (o que guia minhas escolhas):', placeholder: 'Não o que parece bonito. O que de fato te guia.', obrigatorio: true },
          { id: 'limites_nao_aceito', tipo: 'textarea', label: 'O que não aceito na minha jornada de crescimento:', placeholder: 'Ex: trabalhar até adoecer, mentir para vender, ignorar a família...', obrigatorio: true },
          { id: 'limites_declaracao', tipo: 'textarea', label: 'Minha declaração de limite:', placeholder: 'Em uma frase: o que você nunca vai atravessar por crescimento?', obrigatorio: true },
          { id: 'alinhamento_rotina', tipo: 'radio', label: 'Minha rotina atual respeita meus valores?', opcoes: ['Sim', 'Parcialmente', 'Não'], obrigatorio: true },
          { id: 'alinhamento_objetivos', tipo: 'radio', label: 'Meus objetivos respeitam meus limites?', opcoes: ['Sim', 'Parcialmente', 'Não'], obrigatorio: true },
        ],
      },
      {
        id: 'agenda_realista',
        titulo: 'Agenda Realista',
        subtitulo: 'Sem fantasia. Sem culpa.',
        descricao: 'A agenda errada te faz começar cheio de vontade e parar em três dias. A agenda certa respeita quem você é hoje.',
        campos: [
          { id: 'agenda_possivel', tipo: 'textarea', label: 'Monte sua agenda possível (o que você consegue sustentar de verdade):', placeholder: 'Seja realista. Uma mudança pequena e constante supera uma grande e abandonada.', obrigatorio: true },
          { id: 'agenda_respeita', tipo: 'radio', label: 'Essa agenda respeita seus valores e limites?', opcoes: ['Sim', 'Preciso ajustar'], obrigatorio: true },
          { id: 'agenda_ajuste', tipo: 'textarea', label: 'Se precisar ajustar, o que muda:', placeholder: 'O que você reduz para tornar sustentável?', obrigatorio: false },
        ],
      },
      {
        id: 'micro_habitos',
        titulo: 'Micro-Hábitos',
        subtitulo: 'Pequeno e constante supera grande e esporádico.',
        descricao: 'A versão inicial de cada hábito deve ser tão pequena que parece ridícula. É isso que cria constância. Se você falhar 3 vezes seguidas — a meta ainda está grande demais.',
        campos: [
          { id: 'habito1', tipo: 'text', label: 'Micro-hábito 1 (versão mínima):', placeholder: 'Ex: Ler 1 página por dia', obrigatorio: true },
          { id: 'habito2', tipo: 'text', label: 'Micro-hábito 2:', placeholder: 'Ex: 5 minutos de exercício', obrigatorio: false },
          { id: 'habito3', tipo: 'text', label: 'Micro-hábito 3:', placeholder: 'Ex: Registrar 1 gratidão antes de dormir', obrigatorio: false },
          { id: 'habitos_frequencia', tipo: 'textarea', label: 'Com que frequência você vai praticar cada um?', placeholder: 'Seja específico: dias da semana, horário...', obrigatorio: true },
        ],
      },
      {
        id: 'ritual_semanal',
        titulo: 'Ritual Semanal',
        subtitulo: 'Acolher antes de cobrar.',
        descricao: 'Uma vez por semana, sente. Antes de planejar o próximo passo, honre o que você viveu.',
        campos: [
          { id: 'ritual_respeitei', tipo: 'textarea', label: 'Onde me respeitei essa semana?', placeholder: 'Momentos em que você honrou seus valores e limites...', obrigatorio: true },
          { id: 'ritual_gratidao', tipo: 'textarea', label: 'Pelo que sou grato nessa semana?', placeholder: 'Pequenas ou grandes coisas...', obrigatorio: true },
          { id: 'ritual_proximo', tipo: 'textarea', label: 'Um ajuste para a próxima semana:', placeholder: 'Não uma lista. Um ajuste só.', obrigatorio: true },
        ],
      },
      {
        id: 'evidencias_e',
        titulo: 'Evidências',
        subtitulo: 'Sem prova, não existiu.',
        citacao: 'O que prova que cresci sem me trair?',
        campos: [
          { id: 'evid_e_sustentei', tipo: 'textarea', label: 'O que você sustentou nesse caderno que antes não conseguia?', placeholder: 'Comportamentos concretos, não intenções...', obrigatorio: true },
          { id: 'evid_e_limites', tipo: 'textarea', label: 'Em que momento você respeitou seus limites mesmo sob pressão?', placeholder: 'Uma situação real...', obrigatorio: true },
        ],
      },
    ],
  },

  4: {
    numero: 4,
    letra: 'M',
    nome: 'Movimento',
    subtitulo: 'Impacto, legado, posicionamento e relações sólidas.',
    citacao: 'Você não cresce se escondendo. Mas também não cresce se fingindo.',
    cor: 'rose',
    ferramentas: [
      {
        id: 'mapa_direcao',
        titulo: 'Mapa de Direção',
        subtitulo: 'Impedir movimento aleatório.',
        descricao: 'Toda ação deve apontar para algum lugar. Se você não sabe onde quer chegar, qualquer caminho parece certo — e nenhum leva a lugar nenhum.',
        campos: [
          { id: 'mapa_proposito', tipo: 'textarea', label: 'Meu propósito profissional (do Caderno P):', placeholder: 'Relembre e reescreva aqui...', obrigatorio: true },
          { id: 'mapa_6meses', tipo: 'textarea', label: 'Nos próximos 6 meses, eu quero estar:', placeholder: 'Seja específico: onde, como, com quem, fazendo o quê...', obrigatorio: true },
          { id: 'mapa_aponta', tipo: 'radio', label: 'Tudo que você faz hoje aponta para esse destino?', opcoes: ['Sim', 'Parcialmente', 'Não'], obrigatorio: true },
          { id: 'mapa_desvia', tipo: 'textarea', label: 'O que está te puxando para fora do caminho?', placeholder: 'Hábitos, pessoas, distrações, medos...', obrigatorio: false },
        ],
      },
      {
        id: 'movimento_intencao',
        titulo: 'Movimento com Intenção',
        subtitulo: 'Transforme esforço em progresso.',
        descricao: 'Liste o que você faz toda semana. Depois classifique cada ação. A meta é simples: reduzir o que dispersa, aumentar o que constrói.',
        campos: [
          { id: 'mov_constroi', tipo: 'textarea', label: 'O que você faz toda semana que CONSTRÓI seu destino:', placeholder: 'Ações que geram progresso real...', obrigatorio: true },
          { id: 'mov_dispersa', tipo: 'textarea', label: 'O que você faz toda semana que DISPERSA sua energia:', placeholder: 'Ações que ocupam tempo mas não constroem...', obrigatorio: true },
          { id: 'mov_eliminar', tipo: 'textarea', label: 'O que você vai eliminar ou reduzir:', placeholder: 'Decisão concreta, não intenção...', obrigatorio: true },
        ],
      },
      {
        id: 'posicionamento',
        titulo: 'Posicionamento Silencioso',
        subtitulo: 'Construir respeito antes de pedir.',
        citacao: 'Reputação não se declara — se acumula.',
        campos: [
          { id: 'pos_confianca', tipo: 'textarea', label: 'Por que alguém confiaria em mim?', placeholder: 'Baseado em comportamento, não em promessa...', obrigatorio: true },
          { id: 'pos_diferencial', tipo: 'textarea', label: 'Qual é o meu diferencial que não depende de diploma ou título?', placeholder: 'O que é único na sua forma de ser e fazer?', obrigatorio: true },
          { id: 'pos_valor_s1', tipo: 'textarea', label: 'Semana 1 — o que entreguei sem pedir nada:', placeholder: 'Valor real gerado para alguém...', obrigatorio: true },
          { id: 'pos_valor_s2', tipo: 'textarea', label: 'Semana 2 — o que entreguei sem pedir nada:', placeholder: 'Continue registrando...', obrigatorio: false },
          { id: 'pos_valor_s3', tipo: 'textarea', label: 'Semana 3 — o que entreguei sem pedir nada:', placeholder: 'Continue registrando...', obrigatorio: false },
          { id: 'pos_valor_s4', tipo: 'textarea', label: 'Semana 4 — o que entreguei sem pedir nada:', placeholder: 'Continue registrando...', obrigatorio: false },
        ],
      },
      {
        id: 'construcao_relacao',
        titulo: 'Construção de Relação',
        subtitulo: 'Evitar abordagem fria.',
        descricao: 'Ninguém quer ser abordado — as pessoas querem ser compreendidas. Relate pessoas com quem está construindo relação.',
        campos: [
          { id: 'rel_quem', tipo: 'textarea', label: 'Com quem você está construindo relação agora?', placeholder: 'Nome ou contexto das pessoas...', obrigatorio: true },
          { id: 'rel_entregou', tipo: 'textarea', label: 'O que você já entregou para essas pessoas antes de pedir?', placeholder: 'Valor real, não promessa...', obrigatorio: true },
          { id: 'rel_proximo', tipo: 'textarea', label: 'Qual é o próximo passo natural nessa relação?', placeholder: 'Sem forçar. O que faz sentido agora?', obrigatorio: true },
        ],
      },
      {
        id: 'venda_madura',
        titulo: 'Venda como Consequência',
        subtitulo: 'Madura. Sem teatro. Sem pressão.',
        citacao: 'Venda no I.P.E.M não é "compra de mim." É "faz sentido pra você?"',
        campos: [
          { id: 'venda_diagnostico', tipo: 'textarea', label: 'Diagnóstico — o que você entendeu sobre a pessoa antes de oferecer:', placeholder: 'Ex: "Percebi que o problema dela não era o que ela pensava..."', obrigatorio: true },
          { id: 'venda_clareza', tipo: 'textarea', label: 'Clareza — como você mostrou o problema real:', placeholder: 'Como você ajudou a pessoa a ver o que estava acontecendo?', obrigatorio: true },
          { id: 'venda_caminho', tipo: 'textarea', label: 'Caminho — como você apontou a solução:', placeholder: 'O que você propôs, sem pressão?', obrigatorio: true },
          { id: 'venda_convite', tipo: 'textarea', label: 'Convite — como foi sua oferta:', placeholder: '"Faz sentido pra você?" — como isso aconteceu?', obrigatorio: true },
        ],
      },
      {
        id: 'presenca_proposito',
        titulo: 'Presença com Propósito',
        subtitulo: 'Parar de postar vazio.',
        descricao: 'Presença não é frequência — é relevância. Antes de publicar qualquer coisa, passe pelo filtro.',
        campos: [
          { id: 'presenca_filtro', tipo: 'textarea', label: 'O que você vai comunicar/publicar nesse ciclo e por quê:', placeholder: 'Não o que você quer postar. O que gera valor para quem recebe.', obrigatorio: true },
          { id: 'presenca_plataforma', tipo: 'text', label: 'Onde você vai se posicionar (plataforma/canal):', placeholder: 'Instagram, LinkedIn, WhatsApp, presencialmente...', obrigatorio: true },
          { id: 'presenca_frequencia', tipo: 'text', label: 'Com qual frequência sustentável:', placeholder: 'Ex: 2x por semana', obrigatorio: true },
        ],
      },
      {
        id: 'evidencias_m',
        titulo: 'Evidências',
        subtitulo: 'Sem prova, não existiu.',
        citacao: 'O que prova que eu me movi com propósito?',
        campos: [
          { id: 'evid_m_relacao', tipo: 'textarea', label: 'Que relação você construiu ou fortaleceu nesse caderno?', placeholder: 'Uma pessoa real, um vínculo real...', obrigatorio: true },
          { id: 'evid_m_resultado', tipo: 'textarea', label: 'Que resultado concreto seu movimento gerou?', placeholder: 'Não intenção. Resultado.', obrigatorio: true },
          { id: 'evid_m_legado', tipo: 'textarea', label: 'O que você deixou para alguém nesse ciclo?', placeholder: 'Valor, conhecimento, suporte, presença...', obrigatorio: true },
        ],
      },
    ],
  },
}
