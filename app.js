(function () {
  "use strict";
  const C = window.Achadinhos, API = window.AchadinhosAPI;
  const $ = id => document.getElementById(id), form = $("registration"), field = name => form.elements.namedItem(name);
  let plans = {}, revision = "", logo = null, signatureMode = "draw", signed = false, drawing = false, lastPoint, strokeLength = 0, submission = null, result = null, busy = false;
  const canvas = $("signature"), ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#011743"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const nowDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  field("dataAceite").value = nowDate();
  C.terms.forEach(([heading, ...paragraphs]) => { const section = document.createElement("section"); section.className = "clause"; const title = document.createElement("h2"); title.textContent = heading; section.append(title); paragraphs.forEach(text => { const p = document.createElement("p"); p.textContent = text; section.append(p); }); $("clauses").append(section); });
  $("acceptance-text").textContent = C.acceptance;
  function toast(text) { $("toast").textContent = text; $("toast").hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => $("toast").hidden = true, 3500); }
  function notice(text) { $("service-notice").textContent = text; $("service-notice").hidden = !text; }
  function currentPlan() { return plans[field("plano").value]; }
  function summary() {
    const id = field("plano").value, plan = currentPlan(), annual = plan?.annualCents, fee = plan?.feeCents;
    ["annual-value", "summary-annual"].forEach(id => $(id).textContent = C.money(annual));
    ["fee-value", "summary-fee"].forEach(id => $(id).textContent = C.money(fee));
    ["total-value", "summary-total"].forEach(id => $(id).textContent = C.money(Number.isSafeInteger(annual) && Number.isSafeInteger(fee) ? annual + fee : null));
    $("installment-value").textContent = C.installments(annual);
    $("summary-installments").textContent = plan && Number.isSafeInteger(annual) ? `${C.installments(annual)} no cartão de crédito. Valor anual, sem mensalidades independentes.` : "Plano anual em 12 parcelas no cartão";
    $("summary-plan").textContent = id ? `PLANO ${id}` : "Selecione seu plano";
  }
  function showPlans(data) {
    plans = data.plans; revision = data.revision;
    Object.entries(plans).forEach(([id, plan]) => { const available = plan.active && Number.isSafeInteger(plan.annualCents); document.querySelector(`[data-price="${id}"]`).textContent = available ? C.money(plan.annualCents) : "Indisponível"; document.querySelector(`[data-installments="${id}"]`).textContent = available ? C.installments(plan.annualCents) : "Consulte nossa equipe"; form.querySelector(`input[value="${id}"]`).disabled = !available; });
    summary();
    if (!Object.values(plans).some(plan => plan.active && Number.isSafeInteger(plan.annualCents))) notice(window.ACHADINHOS_CONFIG.demoMode?"Os valores dos planos de teste ainda não foram definidos.":"Os planos estão sendo atualizados. Fale com nossa equipe para concluir sua adesão.");
    else notice("");
  }
  async function loadPlans() {
    if (!API.configured) { notice("Os planos estão sendo preparados. Fale com nossa equipe para concluir sua adesão."); return; }
    notice("Carregando os planos disponíveis…");
    try { showPlans(await API.call("plans")); const initial = new URLSearchParams(location.search).get("plano"); if (plans[initial]?.active) { field("plano").value = initial; summary(); } }
    catch { notice("Não foi possível carregar os planos. Recarregue a página ou fale com nossa equipe."); }
  }
  field("cnpj").addEventListener("input", event => { const v = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,14); event.target.value = v.replace(/^(.{2})(.{3})(.{3})(.{4})(.{0,2})$/, "$1.$2.$3/$4-$5"); });
  ["cpf", "cpfAceite"].forEach(name => field(name).addEventListener("input", event => { const v = C.digits(event.target.value).slice(0,11); event.target.value = v.replace(/^(\d{3})(\d)/,"$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/,"$1.$2.$3").replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,"$1.$2.$3-$4"); }));
  form.addEventListener("input", event => { if (!busy) submission = null; if (event.target.setCustomValidity) event.target.setCustomValidity(""); event.target.removeAttribute?.("aria-invalid"); $("submit-error").textContent = ""; if (event.target.name === "plano") summary(); });
  function invalid(control, message) { control.setCustomValidity(message); control.setAttribute("aria-invalid", "true"); }
  function validateFirst() {
    $("page-one").querySelectorAll("input,select").forEach(control => control.setCustomValidity(""));
    if (!/^[A-Z0-9]{12}\d{2}$/.test(field("cnpj").value.replace(/[^A-Z0-9]/g,""))) invalid(field("cnpj"), "Informe um CNPJ completo, com 14 caracteres.");
    if (!C.validCPF(field("cpf").value)) invalid(field("cpf"), "Informe um CPF válido.");
    if (![10,11,12,13].includes(C.digits(field("whatsapp").value).length)) invalid(field("whatsapp"), "Informe um telefone com DDD.");
    const invalidControl = [...$("page-one").querySelectorAll("input,select")].find(control => !control.disabled && !control.checkValidity());
    if (invalidControl) { invalidControl.reportValidity(); invalidControl.focus(); return false; }
    const plan = currentPlan();
    if (!plan?.active || !Number.isSafeInteger(plan.annualCents)) { notice("Escolha um plano com valor disponível para continuar. Se necessário, fale com nossa equipe."); return false; }
    if ($("logo-error").textContent) { $("logo").focus(); return false; }
    return true;
  }
  function page(number) {
    $("page-one").hidden = number !== 1; $("page-two").hidden = number !== 2;
    $("step-one").classList.toggle("active", number === 1); $("step-one").classList.toggle("done", number === 2); $("step-two").classList.toggle("active", number === 2);
    $("step-one").toggleAttribute("aria-current", number === 1); $("step-two").toggleAttribute("aria-current", number === 2);
    if (number === 2) { $("step-two").disabled = false; $("step-two").setAttribute("aria-current","step"); } else $("step-one").setAttribute("aria-current","step");
    $("main").scrollIntoView({ behavior: "auto", block: "start" });
  }
  function next() { if (!validateFirst()) return; field("nomeAceite").value = field("responsavel").value.trim(); field("cpfAceite").value = field("cpf").value; field("dataAceite").value = nowDate(); page(2); }
  $("next").addEventListener("click", next); $("step-two").addEventListener("click", next);
  ["back", "edit-data", "step-one"].forEach(id => $(id).addEventListener("click", () => { if (!busy) page(1); }));
  async function readFile(file) { return await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Não foi possível ler o arquivo.")); reader.readAsDataURL(file); }); }
  let logoVersion = 0;
  $("logo").addEventListener("change", async () => {
    const version = ++logoVersion, file = $("logo").files[0]; logo = null; $("logo-error").textContent = ""; $("logo-info").hidden = true; $("logo-name").textContent = "Clique para anexar arquivo"; $("logo-preview").removeAttribute("src");
    if (!file) return;
    if (!/\.(png|jpe?g|svg)$/i.test(file.name) || !["image/png","image/jpeg","image/svg+xml"].includes(file.type)) { $("logo-error").textContent = "Selecione um arquivo PNG, JPG ou SVG."; $("logo").value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { $("logo-error").textContent = "O logotipo deve ter no máximo 10 MB."; $("logo").value = ""; return; }
    try { const data = await readFile(file); if (version !== logoVersion) return; logo = { name: file.name, type: file.type, data }; $("logo-name").textContent = file.name; $("logo-preview").src = data; $("logo-size").textContent = `${(file.size / 1024).toFixed(0)} KB`; $("logo-info").hidden = false; }
    catch (error) { $("logo-error").textContent = error.message; }
  });
  $("remove-logo").addEventListener("click", () => { logoVersion++; logo = null; $("logo").value = ""; $("logo-info").hidden = true; $("logo-preview").removeAttribute("src"); $("logo-name").textContent = "Clique para anexar arquivo"; submission = null; });
  async function copy(text, feedback) { try { await navigator.clipboard.writeText(text); toast(feedback); } catch { toast("Não foi possível copiar automaticamente. Selecione e copie o texto."); } }
  $("copy-pix").addEventListener("click", () => copy("00000000000000","Chave PIX copiada."));
  function point(event) { const r = canvas.getBoundingClientRect(); return { x:(event.clientX-r.left)*canvas.width/r.width, y:(event.clientY-r.top)*canvas.height/r.height }; }
  canvas.addEventListener("pointerdown", event => { if (busy || event.button > 0) return; event.preventDefault(); drawing=true; lastPoint=point(event); canvas.setPointerCapture(event.pointerId); ctx.beginPath(); ctx.moveTo(lastPoint.x,lastPoint.y); });
  canvas.addEventListener("pointermove", event => { if (!drawing) return; const p=point(event); strokeLength += Math.hypot(p.x-lastPoint.x,p.y-lastPoint.y); ctx.lineTo(p.x,p.y); ctx.stroke(); lastPoint=p; signed=strokeLength>40; $("signature-hint").hidden = true; $("signature-error").textContent=""; submission=null; });
  ["pointerup","pointercancel","lostpointercapture"].forEach(type => canvas.addEventListener(type, () => drawing=false));
  $("clear-signature").addEventListener("click", () => { ctx.clearRect(0,0,canvas.width,canvas.height); signed=false; strokeLength=0; $("signature-hint").hidden=false; submission=null; });
  function mode(nextMode) { signatureMode=nextMode; $("draw-signature").hidden=nextMode!=="draw"; $("typed-signature").hidden=nextMode!=="type"; ["draw","type"].forEach(value => { $(`${value}-mode`).classList.toggle("selected", value===nextMode); $(`${value}-mode`).setAttribute("aria-pressed",String(value===nextMode)); }); $("signature-error").textContent=""; submission=null; }
  $("draw-mode").addEventListener("click",()=>mode("draw")); $("type-mode").addEventListener("click",()=>mode("type"));
  function signatureImage() { if (signatureMode==="draw") return canvas.toDataURL("image/png"); const typed=document.createElement("canvas"); typed.width=1000; typed.height=240; const t=typed.getContext("2d"); t.fillStyle="#011743"; t.font="italic 56px Georgia"; t.fillText(field("assinaturaDigitada").value.trim(),30,135,940); return typed.toDataURL("image/png"); }
  function validateSecond() {
    const controls = [...$("page-two").querySelectorAll("input")]; controls.forEach(c=>c.setCustomValidity(""));
    if (C.normalizeName(field("nomeAceite").value)!==C.normalizeName(field("responsavel").value)) invalid(field("nomeAceite"),"Use o mesmo nome do responsável legal cadastrado.");
    if (C.digits(field("cpfAceite").value)!==C.digits(field("cpf").value)) invalid(field("cpfAceite"),"Use o mesmo CPF do responsável legal cadastrado.");
    if (signatureMode==="type" && C.normalizeName(field("assinaturaDigitada").value)!==C.normalizeName(field("nomeAceite").value)) invalid(field("assinaturaDigitada"),"Digite o nome completo do responsável para assinar.");
    const bad = controls.find(c=>!c.checkValidity()); if (bad) { bad.reportValidity(); bad.focus(); return false; }
    if (signatureMode==="draw"&&!signed) { $("signature-error").textContent="Desenhe sua assinatura ou selecione Digitar para assinar com seu nome completo."; canvas.scrollIntoView({block:"center"}); return false; }
    return true;
  }
  form.addEventListener("submit", async event => {
    event.preventDefault(); if(busy||!validateSecond())return;
    if(!API.configured){$("submit-error").textContent="O cadastro ainda está em preparação. Entre em contato com nossa equipe.";return;}
    if(!submission){const data=Object.fromEntries(new FormData(form).entries()); delete data.assinaturaDigitada; submission={ id:crypto.randomUUID(), resumeKey:crypto.randomUUID(), data, logo, signature:signatureImage(), signatureMode, signatureText:signatureMode==="type"?field("assinaturaDigitada").value.trim():"", revision, termsVersion:C.termsVersion, accepted:true };}
    busy=true; $("confirm").disabled=true; $("confirm").textContent="REGISTRANDO E GERANDO PDF…"; $("submit-error").textContent="";
    const locked=[...form.querySelectorAll("input,select,button")]; locked.forEach(c=>{c.dataset.preDisabled=String(c.disabled);c.disabled=true;});
    try {
      result=await API.call("submit",submission);
      if(!result.accepted)throw new Error("O serviço não confirmou o cadastro.");
      $("form-layout").hidden=true; document.querySelector(".steps").hidden=true; notice(""); $("success").hidden=false;
      $("success-message").textContent=result.emailSent?"Seu termo foi gerado em PDF e enviado à equipe. Uma cópia também foi enviada ao seu e-mail.":"Seu termo foi gerado em PDF e está registrado. O envio por e-mail está pendente; a equipe pode reenviar sua cópia.";
      $("receipt-id").textContent=`Protocolo: ${result.receiptId}`; $("success").scrollIntoView({block:"start"});
    } catch(error) {
      $("submit-error").textContent=error.message;
      if(error.code==="PRICE_CHANGED"){submission=null;await loadPlans();$("submit-error").textContent="Os valores foram atualizados. Volte ao cadastro, confira o novo total e confirme o aceite novamente.";field("aceite").checked=false;}
    } finally { busy=false;locked.forEach(c=>{c.disabled=c.dataset.preDisabled==="true";delete c.dataset.preDisabled;});$("confirm").disabled=false;$("confirm").innerHTML='CONFIRMAR CADASTRO E ADESÃO <span aria-hidden="true">↗</span>'; }
  });
  $("download-pdf").addEventListener("click",async()=>{
    const button=$("download-pdf");button.disabled=true;$("download-error").textContent="";
    try{const pdf=await API.call("receipt",{id:result.receiptId,key:result.downloadKey});const binary=atob(pdf.base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));const a=document.createElement("a");a.href=url;a.download=pdf.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(error){$("download-error").textContent=error.message;}finally{button.disabled=false;}
  });
  if(window.top!==window.self){document.body.textContent="Abra este formulário diretamente pelo link de cadastro.";return;}
  if(window.ACHADINHOS_CONFIG.demoMode){
    const banner=document.createElement("div");banner.className="demo-banner";banner.setAttribute("role","status");banner.textContent="MODO DE TESTE • Este formulário não envia cadastros nem e-mails.";document.querySelector("main").prepend(banner);
    window.addEventListener("storage",event=>{if(event.key==="achadinhos-test-plans-v1")loadPlans();});
  }
  loadPlans();
})();
