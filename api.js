/* Transporte via formulário/iframe: não depende de CORS nem coloca segredos na URL. */
(function () {
  "use strict";
  const pending = new Map();
  const config = window.ACHADINHOS_CONFIG;
  window.addEventListener("message", event => {
    const data = event.data;
    if (!data || data.channel !== "achadinhos-v1" || !pending.has(data.id)) return;
    let expected;
    try { expected = new URL(config.apiUrl, location.href).origin; } catch { return; }
    const google = /^https:\/\/(?:script\.googleusercontent\.com|[a-z0-9-]+[.-]script\.googleusercontent\.com)$/.test(event.origin) || event.origin === "https://script.google.com";
    if (!(google || event.origin === expected)) return;
    const entry = pending.get(data.id);
    entry.cleanup();
    if (data.ok === true) entry.resolve(data.result);
    else { const error = new Error(data.error || "Não foi possível concluir a operação."); error.code = data.code; entry.reject(error); }
  });
  window.AchadinhosAPI = {
    configured: Boolean(config.apiUrl),
    call(action, payload = {}, token = "") {
      if (!config.apiUrl) return Promise.reject(new Error("O serviço de cadastro ainda não foi ativado."));
      let endpoint;
      try { endpoint = new URL(config.apiUrl, location.href); } catch { return Promise.reject(new Error("URL do serviço inválida.")); }
      if (endpoint.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(endpoint.hostname)) return Promise.reject(new Error("O serviço exige HTTPS."));
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2, "0")).join("");
        const frame = document.createElement("iframe"); frame.name = `request-${id}`; frame.hidden = true; frame.title = "Processamento do cadastro";
        const form = document.createElement("form"); form.method = "POST"; form.action = endpoint.href; form.target = frame.name; form.hidden = true;
        const input = document.createElement("textarea"); input.name = "payload";
        input.value = JSON.stringify({ id, action, payload, token, origin: location.origin }); form.append(input);
        let timer;
        const cleanup = () => { clearTimeout(timer); pending.delete(id); form.remove(); frame.remove(); };
        pending.set(id, { resolve, reject, cleanup });
        timer = setTimeout(() => { cleanup(); const error = new Error("O serviço demorou a responder. Confira sua conexão e tente novamente. Se você já confirmou, use o mesmo cadastro para recuperar o resultado."); error.code = "TIMEOUT"; reject(error); }, 90000);
        document.body.append(frame, form); form.submit();
      });
    }
  };
})();
