/* Protótipo local autorizado para teste. Não é autenticação de produção. */
(function () {
  "use strict";
  if (!window.ACHADINHOS_CONFIG.demoMode) return;
  const key = "achadinhos-test-plans-v1", ids = ["BLUE", "TOP", "BLACK"], sessions = new Set();
  const empty = () => ({ revision: crypto.randomUUID(), plans: Object.fromEntries(ids.map(id => [id, { annualCents: null, feeCents: null, active: false }])) });
  let state = empty();
  try { const value = JSON.parse(localStorage.getItem(key)); if (value && typeof value.revision === "string" && ids.every(id => value.plans?.[id])) state = value; } catch { /* Sem armazenamento, o teste funciona nesta aba. */ }
  const copy = value => JSON.parse(JSON.stringify(value));
  function error(message, code = "VALIDATION") { const e = new Error(message); e.code = code; throw e; }
  window.AchadinhosAPI = {
    configured: true,
    async call(action, payload = {}, token = "") {
      if (action === "plans") {
        try { const saved = JSON.parse(localStorage.getItem(key)); if (saved?.revision && ids.every(id => saved.plans?.[id])) state = saved; } catch {}
        return copy(state);
      }
      if (action === "login") {
        if (payload.password !== "123456") error("Senha incorreta. Para testar, use 123456.", "UNAUTHORIZED");
        const session = crypto.randomUUID(); sessions.add(session); return { token: session, ...copy(state) };
      }
      if (action === "submit" || action === "receipt") error("Modo de teste: nenhum cadastro é enviado ou registrado. A integração será configurada depois.", "DEMO_MODE");
      if (!sessions.has(token)) error("Entre novamente no painel de teste.", "UNAUTHORIZED");
      if (action === "logout") { sessions.delete(token); return { ok: true }; }
      if (action === "adminPlans") return copy(state);
      if (action === "listReceipts") return [];
      if (action === "savePlans") {
        try { const saved = JSON.parse(localStorage.getItem(key)); if (saved?.revision && ids.every(id => saved.plans?.[id])) state = saved; } catch {}
        if (payload.revision !== state.revision) error("Os valores foram alterados em outra aba. Confira novamente.", "CONFLICT");
        const plans = {};
        for (const id of ids) {
          const p = payload.plans?.[id];
          if (!p || typeof p.active !== "boolean" || (p.active && (!Number.isSafeInteger(p.annualCents) || p.annualCents <= 0)) || (p.annualCents !== null && (!Number.isSafeInteger(p.annualCents) || p.annualCents < 0 || p.annualCents > 100000000)) || (p.feeCents !== null && (!Number.isSafeInteger(p.feeCents) || p.feeCents < 0 || p.feeCents > 100000000)) || (p.active && p.feeCents === null)) error("Informe valores válidos para o plano " + id + ".");
          plans[id] = { annualCents: p.annualCents, feeCents: p.feeCents, active: p.active };
        }
        state = { plans, revision: crypto.randomUUID() };
        try { localStorage.setItem(key, JSON.stringify(state)); } catch { error("O navegador bloqueou o armazenamento. Permita dados do site para guardar os planos de teste.", "STORAGE"); }
        return copy(state);
      }
      error("Operação indisponível no modo de teste.", "DEMO_MODE");
    }
  };
})();
