import { describe, expect, it } from "vitest";
import { linkDoSuporte, MENSAGEM_PADRAO_DO_SUPORTE, parceiroDoAmbiente } from "./parceiro";

describe("parceiroDoAmbiente", () => {
  it("sem variáveis, não há parceiro e nenhuma tela muda", () => {
    expect(parceiroDoAmbiente({})).toBeNull();
  });

  it("lê nome, WhatsApp, site e logo do .env", () => {
    const p = parceiroDoAmbiente({
      PARCEIRO_NOME: "Agência X",
      PARCEIRO_WHATSAPP: "+55 (11) 97053-0923",
      PARCEIRO_SITE: "https://agencia.example",
      PARCEIRO_LOGO_URL: "/parceiro/logo.png",
    });
    expect(p).toEqual({
      nome: "Agência X",
      whatsapp: "5511970530923",
      site: "https://agencia.example/",
      logoUrl: "/parceiro/logo.png",
      mensagem: MENSAGEM_PADRAO_DO_SUPORTE,
    });
  });

  it("recusa endereço sem https, logo de outro host por // e caminho com ..", () => {
    const p = parceiroDoAmbiente({
      PARCEIRO_NOME: "X",
      PARCEIRO_SITE: "http://inseguro.example",
      PARCEIRO_LOGO_URL: "//outro.example/logo.png",
    });
    expect(p?.site).toBeNull();
    expect(p?.logoUrl).toBeNull();
    expect(parceiroDoAmbiente({ PARCEIRO_NOME: "X", PARCEIRO_LOGO_URL: "/../etc/x" })?.logoUrl).toBeNull();
    expect(parceiroDoAmbiente({ PARCEIRO_NOME: "X", PARCEIRO_LOGO_URL: "javascript:alert(1)" })?.logoUrl).toBeNull();
  });

  it("WhatsApp com poucos dígitos não vira botão", () => {
    expect(parceiroDoAmbiente({ PARCEIRO_NOME: "X", PARCEIRO_WHATSAPP: "1234" })?.whatsapp).toBeNull();
  });
});

describe("linkDoSuporte", () => {
  const p = parceiroDoAmbiente({ PARCEIRO_NOME: "X", PARCEIRO_WHATSAPP: "5511970530923" });

  it("leva a tela de origem, a empresa e o sistema na mensagem", () => {
    const link = linkDoSuporte(p, { sistema: "CRM", empresa: "Escritório A", tela: "Conversas" });
    expect(link).toBe(
      "https://wa.me/5511970530923?text=" +
        encodeURIComponent("Olá! Preciso de ajuda no CRM. Empresa: Escritório A. Tela: Conversas."),
    );
  });

  it("campo ausente vira hífen, sem deixar a chave crua", () => {
    const link = decodeURIComponent(linkDoSuporte(p, { tela: "Login" }) ?? "");
    expect(link).toContain("Empresa: -. Tela: Login.");
    expect(link).not.toContain("{");
  });

  it("sem WhatsApp não há link", () => {
    expect(linkDoSuporte(parceiroDoAmbiente({ PARCEIRO_NOME: "X" }), {})).toBeNull();
    expect(linkDoSuporte(null, {})).toBeNull();
  });
});
