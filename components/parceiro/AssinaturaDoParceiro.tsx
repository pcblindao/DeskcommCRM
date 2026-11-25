/**
 * A assinatura do parceiro (logo ou nome, com link para o site). Sem hooks:
 * serve ao rodapé do menu (client) e ao login (server).
 */
import type { Parceiro } from "@/lib/parceiro/parceiro";
import { cn } from "@/lib/utils";

export function AssinaturaDoParceiro({
  parceiro,
  rotulo,
  className,
}: {
  parceiro: Parceiro;
  /** Texto pequeno antes da assinatura (ex.: "Implantação e suporte"). */
  rotulo?: string;
  className?: string;
}) {
  const marca = parceiro.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- logo do .env, tamanho livre
    <img src={parceiro.logoUrl} alt={parceiro.nome} className="h-5 w-auto max-w-[160px] object-contain" />
  ) : (
    <span className="text-xs font-semibold">{parceiro.nome}</span>
  );
  return (
    <div
      className={cn("flex flex-col items-center gap-1 text-[11px] text-muted-foreground", className)}
      data-testid="assinatura-do-parceiro"
    >
      {rotulo && <span>{rotulo}</span>}
      {parceiro.site ? (
        <a
          href={parceiro.site}
          target="_blank"
          rel="noopener noreferrer"
          title={parceiro.nome}
          className="opacity-90 transition-opacity hover:opacity-100"
        >
          {marca}
        </a>
      ) : (
        marca
      )}
    </div>
  );
}
