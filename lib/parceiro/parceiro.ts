/**
 * O PARCEIRO que instalou e dá suporte a esta instalação (agência, consultor).
 *
 * Diferente da marca da instalação (`lib/branding`), que é a marca que o cliente
 * vê como dono do sistema, o parceiro é quem assina embaixo: aparece no rodapé
 * do menu e do login, com o botão "Falar com o suporte".
 *
 * Fonte: só o `.env` (PARCEIRO_*). Nada fica no código: sem as variáveis,
 * `parceiroDoAmbiente()` devolve `null` e nenhuma tela muda. Puro, sem DOM, sem
 * I/O e NUNCA lança: roda no layout raiz, e um throw ali seria 500 em toda tela.
 */

export interface Parceiro {
  /** Nome de quem assina (texto alternativo do logo e título do link). */
  nome: string;
  /** Site do parceiro, só `https://`. */
  site: string | null;
  /** Logo: caminho local (`/parceiro/x.png`) ou `https://`. */
  logoUrl: string | null;
  /** WhatsApp do suporte, só dígitos com DDI (ex.: 5511970530923). */
  whatsapp: string | null;
  /** Mensagem inicial, com {sistema}, {empresa} e {tela}. */
  mensagem: string;
}

export const MENSAGEM_PADRAO_DO_SUPORTE =
  "Olá! Preciso de ajuda no {sistema}. Empresa: {empresa}. Tela: {tela}.";

type Fonte = Record<string, string | undefined>;

function texto(valor: string | undefined, limite: number): string {
  return (valor ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limite);
}

function urlHttps(valor: string): string | null {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function caminhoDoLogo(valor: string): string | null {
  if (!valor) return null;
  // Caminho do próprio app (`/parceiro/logo.png`), nunca `//outro-host`.
  if (/^\/[A-Za-z0-9._~\-/]+$/.test(valor) && !valor.startsWith("//") && !valor.includes(".."))
    return valor;
  return urlHttps(valor);
}

export function parceiroDoAmbiente(fonte: Fonte = process.env): Parceiro | null {
  try {
    const nome = texto(fonte.PARCEIRO_NOME, 80);
    const digitos = texto(fonte.PARCEIRO_WHATSAPP, 40).replace(/\D/g, "");
    const whatsapp = digitos.length >= 10 && digitos.length <= 15 ? digitos : null;
    if (!nome && !whatsapp) return null;
    const site = urlHttps(texto(fonte.PARCEIRO_SITE, 300));
    const logoUrl = caminhoDoLogo(texto(fonte.PARCEIRO_LOGO_URL, 300));
    const mensagem = texto(fonte.PARCEIRO_MENSAGEM, 500) || MENSAGEM_PADRAO_DO_SUPORTE;
    return { nome: nome || "Suporte", site, logoUrl, whatsapp, mensagem };
  } catch {
    return null;
  }
}

export interface ContextoDoSuporte {
  sistema?: string | null;
  empresa?: string | null;
  tela?: string | null;
}

/** O link `wa.me` com a mensagem já preenchida, ou `null` sem WhatsApp. */
export function linkDoSuporte(parceiro: Parceiro | null, contexto: ContextoDoSuporte): string | null {
  if (!parceiro?.whatsapp) return null;
  const valor = (v: string | null | undefined) => (v ?? "").trim() || "-";
  const mensagem = parceiro.mensagem
    .replaceAll("{sistema}", valor(contexto.sistema))
    .replaceAll("{empresa}", valor(contexto.empresa))
    .replaceAll("{tela}", valor(contexto.tela));
  return `https://wa.me/${parceiro.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
