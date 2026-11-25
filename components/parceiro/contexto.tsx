"use client";

/**
 * O parceiro (`lib/parceiro/parceiro.ts`) para client components, por PROP do
 * servidor — o mesmo caminho de `lib/branding/contexto.tsx`, para o SSR e a
 * hidratação desenharem o mesmo rodapé. Fora do provedor, `null`: sem rodapé.
 */
import { createContext, useContext } from "react";
import type { Parceiro } from "@/lib/parceiro/parceiro";

const ContextoDoParceiro = createContext<Parceiro | null>(null);

export function ParceiroProvider({
  parceiro,
  children,
}: {
  parceiro: Parceiro | null;
  children: React.ReactNode;
}) {
  return <ContextoDoParceiro.Provider value={parceiro}>{children}</ContextoDoParceiro.Provider>;
}

export function useParceiro(): Parceiro | null {
  return useContext(ContextoDoParceiro);
}
