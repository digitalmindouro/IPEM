import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

const PRETO = hexToRgb('#0f0e0b')
const DOURADO = hexToRgb('#d4a843')
const DOURADO_CLARO = hexToRgb('#c8a96e')
const BEGE = hexToRgb('#f5f0e8')
const CINZA = hexToRgb('#7a7060')
const CINZA_ESCURO = hexToRgb('#3a3228')

const TIPOS_LABEL: Record<string, string> = {
  conclusao_ipem: 'CERTIFICADO DE CONCLUSAO',
  formacao_facilitador: 'CERTIFICADO DE FORMACAO - FACILITADOR',
  formacao_mentor: 'CERTIFICADO DE FORMACAO - MENTOR',
  formacao_guardiao: 'CERTIFICADO DE FORMACAO - GUARDIAO',
}

const TIPOS_DESC: Record<string, string> = {
  conclusao_ipem: 'concluiu com exito todos os cadernos do metodo I.P.E.M',
  formacao_facilitador: 'completou a formacao como Facilitador Ordenismo',
  formacao_mentor: 'completou a formacao como Mentor Ordenismo',
  formacao_guardiao: 'completou a formacao como Guardiao Ordenismo',
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: cert } = await supabase
      .from('certificados')
      .select(`*, membro:profiles!membro_id(nome), emissor:profiles!emitido_por(nome)`)
      .eq('id', params.id)
      .single()

    if (!cert) return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })

    const nomeMembro = cert.membro?.nome ?? 'Membro'
    const nomeEmissor = cert.emissor?.nome ?? 'Ordenismo'
    const codigo = cert.codigo_unico
    const tipo = cert.tipo
    const data = new Date(cert.data_emissao).toLocaleDateString('pt-BR')

    // Criar PDF A4 landscape
    const doc = await PDFDocument.create()
    const page = doc.addPage([841.89, 595.28]) // A4 landscape
    const { width, height } = page.getSize()

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
    const fontNormal = await doc.embedFont(StandardFonts.Helvetica)
    const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique)

    // Fundo preto
    page.drawRectangle({ x: 0, y: 0, width, height, color: PRETO })

    // Borda dourada externa
    page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: DOURADO, borderWidth: 2, color: undefined })

    // Borda interna
    page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: DOURADO_CLARO, borderWidth: 0.5, color: undefined })

    // Linhas decorativas
    page.drawLine({ start: { x: 60, y: height - 70 }, end: { x: width - 60, y: height - 70 }, color: DOURADO, thickness: 1 })
    page.drawLine({ start: { x: 60, y: 70 }, end: { x: width - 60, y: 70 }, color: DOURADO, thickness: 1 })

    // ORDENISMO
    const textoOrdenismo = 'O R D E N I S M O'
    const wOrdenismo = fontNormal.widthOfTextAtSize(textoOrdenismo, 9)
    page.drawText(textoOrdenismo, { x: width / 2 - wOrdenismo / 2, y: height - 58, size: 9, font: fontNormal, color: DOURADO_CLARO })

    // I.P.E.M
    const textoIPEM = 'I . P . E . M'
    const wIPEM = fontBold.widthOfTextAtSize(textoIPEM, 28)
    page.drawText(textoIPEM, { x: width / 2 - wIPEM / 2, y: height - 115, size: 28, font: fontBold, color: DOURADO })

    // Subtítulo
    const subtitulo = 'Intelecto  .  Profissional  .  Emocional  .  Movimento'
    const wSub = fontNormal.widthOfTextAtSize(subtitulo, 9)
    page.drawText(subtitulo, { x: width / 2 - wSub / 2, y: height - 133, size: 9, font: fontNormal, color: CINZA })

    // Linha separadora
    page.drawLine({ start: { x: width / 2 - 100, y: height - 147 }, end: { x: width / 2 + 100, y: height - 147 }, color: CINZA_ESCURO, thickness: 0.5 })

    // Tipo do certificado
    const labelTipo = TIPOS_LABEL[tipo] ?? 'CERTIFICADO'
    const wTipo = fontNormal.widthOfTextAtSize(labelTipo, 10)
    page.drawText(labelTipo, { x: width / 2 - wTipo / 2, y: height - 178, size: 10, font: fontNormal, color: DOURADO_CLARO })

    // "Certificamos que"
    const txtCert = 'Certificamos que'
    const wCert = fontNormal.widthOfTextAtSize(txtCert, 10)
    page.drawText(txtCert, { x: width / 2 - wCert / 2, y: height - 213, size: 10, font: fontNormal, color: CINZA })

    // Nome do membro
    const wNome = fontBold.widthOfTextAtSize(nomeMembro, 32)
    page.drawText(nomeMembro, { x: width / 2 - wNome / 2, y: height - 258, size: 32, font: fontBold, color: BEGE })

    // Linha sob o nome
    page.drawLine({ start: { x: width / 2 - wNome / 2, y: height - 268 }, end: { x: width / 2 + wNome / 2, y: height - 268 }, color: DOURADO, thickness: 1 })

    // Descrição
    const desc = TIPOS_DESC[tipo] ?? 'concluiu o programa Ordenismo'
    const wDesc = fontNormal.widthOfTextAtSize(desc, 10)
    page.drawText(desc, { x: width / 2 - wDesc / 2, y: height - 298, size: 10, font: fontNormal, color: CINZA })

    // Frase
    const frase = '"Antes de mudar o mundo, eu me organizei."'
    const wFrase = fontOblique.widthOfTextAtSize(frase, 10)
    page.drawText(frase, { x: width / 2 - wFrase / 2, y: height - 333, size: 10, font: fontOblique, color: DOURADO_CLARO })

    // Assinaturas
    const assinY = 95

    // Linha esquerda
    page.drawLine({ start: { x: width / 2 - 220, y: assinY + 20 }, end: { x: width / 2 - 60, y: assinY + 20 }, color: CINZA_ESCURO, thickness: 0.5 })
    const wEmissor = fontNormal.widthOfTextAtSize(nomeEmissor, 9)
    page.drawText(nomeEmissor, { x: width / 2 - 140 - wEmissor / 2, y: assinY + 6, size: 9, font: fontNormal, color: BEGE })
    const wOrd = fontNormal.widthOfTextAtSize('Ordenismo', 8)
    page.drawText('Ordenismo', { x: width / 2 - 140 - wOrd / 2, y: assinY - 6, size: 8, font: fontNormal, color: CINZA })

    // Data (centro)
    const wData = fontNormal.widthOfTextAtSize(data, 9)
    page.drawText(data, { x: width / 2 - wData / 2, y: assinY + 6, size: 9, font: fontNormal, color: BEGE })
    const wDataLabel = fontNormal.widthOfTextAtSize('Data de conclusao', 8)
    page.drawText('Data de conclusao', { x: width / 2 - wDataLabel / 2, y: assinY - 6, size: 8, font: fontNormal, color: CINZA })

    // Código (direita)
    page.drawLine({ start: { x: width / 2 + 60, y: assinY + 20 }, end: { x: width / 2 + 220, y: assinY + 20 }, color: CINZA_ESCURO, thickness: 0.5 })
    const wCodigo = fontNormal.widthOfTextAtSize(codigo, 8)
    page.drawText(codigo, { x: width / 2 + 140 - wCodigo / 2, y: assinY + 6, size: 8, font: fontNormal, color: DOURADO_CLARO })
    const wCodigoLabel = fontNormal.widthOfTextAtSize('Codigo de Verificacao', 8)
    page.drawText('Codigo de Verificacao', { x: width / 2 + 140 - wCodigoLabel / 2, y: assinY - 6, size: 8, font: fontNormal, color: CINZA })

    // Rodapé
    const rodape = 'Ordenismo - Sistema I.P.E.M  |  Este certificado possui codigo unico de verificacao'
    const wRodape = fontNormal.widthOfTextAtSize(rodape, 7)
    page.drawText(rodape, { x: width / 2 - wRodape / 2, y: 33, size: 7, font: fontNormal, color: CINZA })

    const pdfBytes = await doc.save()
    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${codigo}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar certificado' }, { status: 500 })
  }
}
