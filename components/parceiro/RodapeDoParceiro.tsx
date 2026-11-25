"use client";

/**
 * Rodapé do menu lateral: "Falar com o suporte" (WhatsApp do parceiro, com a
 * tela aberta na mensagem) e a assinatura do parceiro. Sem parceiro no `.env`,
 * não desenha nada.
 */
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/AuthProvider";
import { useT } from "@/hooks/i18n/useT";
import { useMarcaDaInstalacao } from "@/lib/branding/contexto";
import { NAV_DESTINATIONS } from "@/lib/navigation/registry";
import { linkDoSuporte } from "@/lib/parceiro/parceiro";
import { WhatsappLogo } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";
import { AssinaturaDoParceiro } from "./AssinaturaDoParceiro";
import { useParceiro } from "./contexto";

/** O nome da tela aberta: o destino do menu de `href` mais longo que casa. */
export function nomeDaTela(pathname: string, destinos = NAV_DESTINATIONS): string | null {
  let melhor: { href: string; label: string } | null = null;
  for (const d of destinos) {
    const casa = pathname === d.href || pathname.startsWith(`${d.href}/`);
    if (casa && (!melhor || d.href.length > melhor.href.length)) melhor = d;
  }
  return melhor?.label ?? null;
}

export function RodapeDoParceiro({ collapsed }: { collapsed: boolean }) {
  const parceiro = useParceiro();
  const pathname = usePathname();
  const { activeOrg } = useAuth();
  const marca = useMarcaDaInstalacao();
  const t = useT();
  if (!parceiro) return null;

  const tela = nomeDaTela(pathname);
  const link = linkDoSuporte(parceiro, {
    sistema: marca.name,
    empresa: activeOrg?.name ?? null,
    tela: tela ? t(tela) : pathname,
  });
  const rotulo = t("Falar com o suporte");

  return (
    <>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? rotulo : undefined}
          data-testid="suporte-do-parceiro"
          className={cn(
            "mb-0.5 flex items-center gap-3 rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <WhatsappLogo size={18} aria-hidden />
          {!collapsed && <span className="truncate">{rotulo}</span>}
        </a>
      )}
      {!collapsed && <AssinaturaDoParceiro parceiro={parceiro} className="py-1.5" />}
    </>
  );
}
