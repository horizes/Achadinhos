(function (root) {
  "use strict";
  const money = cents => Number.isSafeInteger(cents) ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100) : "—";
  function parseMoney(value) {
    let text = String(value).trim().replace(/R\$\s?/g, "").replace(/\s/g, "");
    if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
    const [whole, decimals = ""] = text.split(".");
    const result = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
    return Number.isSafeInteger(result) && result <= 100000000 ? result : null;
  }
  const digits = value => String(value || "").replace(/\D/g, "");
  function validCPF(value) {
    const cpf = digits(value);
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    for (let size = 9; size <= 10; size++) {
      let sum = 0;
      for (let i = 0; i < size; i++) sum += Number(cpf[i]) * (size + 1 - i);
      const check = (sum * 10) % 11;
      if ((check === 10 ? 0 : check) !== Number(cpf[size])) return false;
    }
    return true;
  }
  const normalizeName = value => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
  function installments(cents) {
    if (!Number.isSafeInteger(cents)) return "12 parcelas —";
    const base = Math.floor(cents / 12), extra = cents % 12;
    return extra ? `${12 - extra}× de ${money(base)} + ${extra}× de ${money(base + 1)}` : `12× de ${money(base)}`;
  }
  const terms = [
    ["4. OBJETO DA CONTRATAÇÃO", "Ao confirmar seu cadastro, a empresa, denominada CONTRATANTE, declara estar ciente e de acordo com a contratação dos serviços do Achadinhos do Condomínio, denominado CONTRATADA.", "Os serviços incluem divulgação nas redes sociais (Instagram, Facebook, TikTok e LinkedIn), presença na plataforma digital, fortalecimento da marca e oportunidades de networking por meio de eventos e ações comerciais, conforme as condições e entregas previstas no plano contratado."],
    ["5. VIGÊNCIA E VALOR CONTRATUAL", "A contratação possui vigência de 12 (doze) meses, mediante pagamento de um valor único anual, previamente acordado e dividido em 12 parcelas no cartão de crédito.", "O parcelamento constitui uma facilidade de pagamento do valor total contratado, não caracterizando contratação mensal independente."],
    ["6. CANCELAMENTO ANTECIPADO", "Em caso de cancelamento antecipado por iniciativa da CONTRATANTE, permanece prevista a obrigação de pagamento das parcelas restantes do valor anual contratado, observados os limites legais aplicáveis."],
    ["7. RENOVAÇÃO AUTOMÁTICA", "Ao término dos 12 meses, o contrato será renovado automaticamente por igual período, mantendo-se as condições contratadas, salvo solicitação formal de cancelamento pela CONTRATANTE.", "Canais oficiais para cancelamento: E-mail: grupomf7@gmail.com. WhatsApp: (19) 99388-2224."],
    ["8. RESPONSABILIDADES E DIVULGAÇÃO", "A CONTRATANTE autoriza a utilização de sua marca, logotipo e materiais institucionais para execução das divulgações contratadas e responsabiliza-se pelas informações fornecidas.", "A CONTRATADA compromete-se a executar os serviços previstos no plano escolhido, sem garantia de vendas, clientes ou resultados financeiros específicos.", "Os dados fornecidos serão tratados conforme a legislação de proteção de dados aplicável."]
  ];
  const acceptance = "Declaro que li, compreendi e aceito integralmente as condições contratuais, incluindo o plano escolhido, o valor único anual parcelado em 12 vezes no cartão de crédito, a taxa de adesão inicial paga separadamente por PIX ou boleto bancário, a vigência de 12 meses, as condições de cancelamento antecipado e a renovação automática.";
  const api = { money, parseMoney, digits, validCPF, normalizeName, installments, terms, acceptance, termsVersion: "2026-10-10.1" };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Achadinhos = api;
})(typeof window === "undefined" ? globalThis : window);
