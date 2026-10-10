/* Google Apps Script — V8. Instale também Core.gs. Segredos somente nas Propriedades do script. */
const HEADERS = ['ID','Data UTC','Empresa','Plano','E-mail','Anual centavos','Adesão centavos','PDF ID','Registro ID','Logo ID','Assinatura ID','SHA-256','Chave download hash','Chave retomada hash','E-mail enviado'];
const PLAN_IDS = ['BLUE','TOP','BLACK'];
function props_() { return PropertiesService.getScriptProperties(); }
function fail_(message, code) { const e = new Error(message); e.code = code || 'VALIDATION'; throw e; }
function sha_(text) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join(''); }
function equal_(a,b) { a=String(a);b=String(b);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0; }
function lock_(callback) { const lock=LockService.getScriptLock(); if(!lock.tryLock(20000))fail_('O serviço está ocupado. Tente novamente em instantes.','BUSY');try{return callback();}finally{lock.releaseLock();} }
function secret_() { return Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,''); }
function validateSetup_() { const p=props_();if(!p.getProperty('SHEET_ID')||!p.getProperty('FOLDER_ID')||!p.getProperty('SITE_ORIGIN'))fail_('O serviço ainda não foi ativado.','SETUP'); }

/* Execute uma vez no editor, após definir ADMIN_PASSWORD, OWNER_EMAIL e SITE_ORIGIN. */
function setup() {
  const p=props_(),password=p.getProperty('ADMIN_PASSWORD')||'',origin=p.getProperty('SITE_ORIGIN')||'',email=p.getProperty('OWNER_EMAIL')||'';
  if(password.length<16)throw new Error('Defina ADMIN_PASSWORD com pelo menos 16 caracteres nas Propriedades do script.');
  if(!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origin))throw new Error('SITE_ORIGIN deve ser apenas a origem HTTPS, por exemplo https://seu-usuario.github.io (sem barra nem caminho).');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Defina OWNER_EMAIL com o e-mail que receberá os cadastros.');
  if(!p.getProperty('FOLDER_ID'))p.setProperty('FOLDER_ID',DriveApp.createFolder('Achadinhos — cadastros e termos').getId());
  if(!p.getProperty('SHEET_ID')){const ss=SpreadsheetApp.create('Achadinhos — cadastros');const sheet=ss.getSheets()[0];sheet.setName('Cadastros');sheet.appendRow(HEADERS);sheet.setFrozenRows(1);p.setProperty('SHEET_ID',ss.getId());}
  if(!p.getProperty('DOWNLOAD_SECRET'))p.setProperty('DOWNLOAD_SECRET',secret_());
  if(!p.getProperty('PLANS')){const plans={};PLAN_IDS.forEach(id=>plans[id]={annualCents:null,feeCents:null,active:false});p.setProperty('PLANS',JSON.stringify({plans,revision:Utilities.getUuid()}));}
  // Verifica a autorização do envio sem disparar nenhuma mensagem.
  MailApp.getRemainingDailyQuota();
  console.log('Planilha: https://docs.google.com/spreadsheets/d/'+p.getProperty('SHEET_ID')+'/edit');
  console.log('Pasta privada: https://drive.google.com/drive/folders/'+p.getProperty('FOLDER_ID'));
  console.log('Configuração concluída. Publique como Aplicativo da Web e salve os preços pelo painel.');
}
function doGet() { return HtmlService.createHtmlOutput('<!doctype html><html lang="pt-BR"><body><p>Serviço Achadinhos do Condomínio. Acesse o formulário pelo link oficial.</p></body></html>'); }
function doPost(event) {
  let req={},response;
  try {
    validateSetup_();req=JSON.parse(event.parameter.payload||'{}');
    if(!/^[a-z0-9-]{20,80}$/i.test(String(req.id||'')))fail_('Solicitação inválida.');
    if(req.origin!==props_().getProperty('SITE_ORIGIN'))fail_('Origem não autorizada.','ORIGIN');
    response={channel:'achadinhos-v1',id:req.id,ok:true,result:dispatch_(req)};
  } catch(error) { response={channel:'achadinhos-v1',id:req.id||'',ok:false,error:error.code?error.message:'Não foi possível concluir. Tente novamente ou fale com a equipe.',code:error.code||'SERVER'}; }
  const safe=JSON.stringify(response).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const origin=JSON.stringify(props_().getProperty('SITE_ORIGIN')||'https://invalid.example');
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.top.postMessage('+safe+','+origin+');</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function dispatch_(req) {
  const data=req.payload||{};
  if(req.action==='plans')return plans_();
  if(req.action==='login')return login_(data.password);
  if(req.action==='submit')return register_(data);
  if(req.action==='receipt')return receipt_(data);
  auth_(req.token);
  if(req.action==='logout'){CacheService.getScriptCache().remove('session:'+sha_(req.token));return {ok:true};}
  if(req.action==='adminPlans')return plans_();
  if(req.action==='savePlans')return savePlans_(data);
  if(req.action==='listReceipts')return list_();
  if(req.action==='resend')return resend_(data.id);
  fail_('Operação desconhecida.');
}
function plans_() { return JSON.parse(props_().getProperty('PLANS')); }
function auth_(token) { if(typeof token!=='string'||token.length<40||!CacheService.getScriptCache().get('session:'+sha_(token)))fail_('Acesso administrativo não autorizado.','UNAUTHORIZED'); }
function login_(password) {
  return lock_(()=>{
    const p=props_(),now=Date.now(),rate=JSON.parse(p.getProperty('LOGIN_RATE')||'{"until":0,"failures":0}');
    if(rate.until<now){rate.until=now+15*60000;rate.failures=0;}
    if(rate.failures>=12)fail_('Muitas tentativas. Aguarde 15 minutos antes de entrar novamente.','RATE_LIMIT');
    if(typeof password!=='string'||!equal_(sha_(password),sha_(p.getProperty('ADMIN_PASSWORD')||secret_()))){rate.failures++;p.setProperty('LOGIN_RATE',JSON.stringify(rate));fail_('Senha incorreta.','UNAUTHORIZED');}
    p.deleteProperty('LOGIN_RATE');const token=secret_();CacheService.getScriptCache().put('session:'+sha_(token),'1',21600);return Object.assign({token},plans_());
  });
}
function savePlans_(data) {
  return lock_(()=>{
    if(data.revision!==plans_().revision)fail_('Os planos foram alterados em outro acesso. Confira os valores atuais.','CONFLICT');
    const plans={};PLAN_IDS.forEach(id=>{const plan=data.plans&&data.plans[id];if(!plan||!Number.isSafeInteger(plan.annualCents)||plan.annualCents<=0||plan.annualCents>100000000||!Number.isSafeInteger(plan.feeCents)||plan.feeCents<0||plan.feeCents>100000000||typeof plan.active!=='boolean')fail_('Valores inválidos para '+id+'.');plans[id]={annualCents:plan.annualCents,feeCents:plan.feeCents,active:plan.active};});
    const saved={plans,revision:Utilities.getUuid()};props_().setProperty('PLANS',JSON.stringify(saved));return saved;
  });
}
function sheet_() { return SpreadsheetApp.openById(props_().getProperty('SHEET_ID')).getSheetByName('Cadastros'); }
function folder_() { return DriveApp.getFolderById(props_().getProperty('FOLDER_ID')); }
function find_(id) { if(!/^[a-f0-9-]{36}$/i.test(String(id||'')))fail_('Protocolo inválido.');const sheet=sheet_();if(sheet.getLastRow()<2)return null;const match=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();return match?{row:match.getRow(),values:sheet.getRange(match.getRow(),1,1,HEADERS.length).getValues()[0]}:null; }
function safeCell_(value) { return /^[=+@-]/.test(String(value))?"'"+value:value; }
function clean_(value,max,required) { if(typeof value!=='string'||value.length>max)fail_('Informação inválida ou muito longa.');const text=value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');if(required&&!text)fail_('Preencha todos os campos obrigatórios.');return text; }
function validateData_(input) {
  const out={},limits={razaoSocial:180,nomeFantasia:120,cnpj:18,segmento:100,endereco:250,cidade:100,estado:2,whatsapp:25,email:180,instagram:150,site:200,responsavel:150,cpf:14,cargo:100,inicio:10,nomeAceite:150,cpfAceite:14};
  Object.keys(limits).forEach(key=>out[key]=clean_(input[key]||'',limits[key],!['instagram','site'].includes(key)));
  if(!/^[A-Z0-9]{12}\d{2}$/.test(out.cnpj.toUpperCase().replace(/[^A-Z0-9]/g,'')))fail_('CNPJ incompleto.');
  if(!Achadinhos.validCPF(out.cpf)||Achadinhos.digits(out.cpf)!==Achadinhos.digits(out.cpfAceite))fail_('Confira o CPF do responsável.');
  if(Achadinhos.normalizeName(out.nomeAceite)!==Achadinhos.normalizeName(out.responsavel))fail_('O nome do aceite deve ser o do responsável legal.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))fail_('E-mail inválido.');
  if(![10,11,12,13].includes(Achadinhos.digits(out.whatsapp).length))fail_('Telefone inválido.');
  if(!['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(out.estado))fail_('Estado inválido.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(out.inicio)||!Number.isFinite(new Date(out.inicio+'T12:00:00Z').getTime())||new Date(out.inicio+'T12:00:00Z').toISOString().slice(0,10)!==out.inicio)fail_('Data de início inválida.');
  if(!PLAN_IDS.includes(input.plano))fail_('Plano inválido.');out.plano=input.plano;
  if(!['PIX','BOLETO'].includes(input.pagamentoAdesao))fail_('Selecione PIX ou boleto para a adesão.');out.pagamentoAdesao=input.pagamentoAdesao;
  if(input.aceite!=='on'||input.websiteAlternativo)fail_('Confirme o aceite do termo.');
  return out;
}
function imageBlob_(data,name,logo) {
  if(typeof data!=='string'||data.length>(logo?14500000:1500000))fail_('Arquivo de imagem excede o limite.');
  const match=data.match(/^data:(image\/(?:png|jpeg|svg\+xml));base64,([A-Za-z0-9+/=]+)$/);
  if(!match||(!logo&&match[1]!=='image/png'))fail_('Formato de imagem não permitido.');
  const bytes=Utilities.base64Decode(match[2]);if(bytes.length>(logo?10*1024*1024:1024*1024))fail_('Imagem muito grande.');
  if(match[1]==='image/png'&&!(bytes.length>8&&(bytes[0]&255)===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71))fail_('PNG inválido.');
  if(match[1]==='image/jpeg'&&!(bytes.length>3&&(bytes[0]&255)===255&&(bytes[1]&255)===216))fail_('JPEG inválido.');
  if(match[1]==='image/svg+xml'){const svg=Utilities.newBlob(bytes).getDataAsString();if(!/<svg[\s>]/i.test(svg)||/<(?:script|foreignObject|iframe|object|embed)\b|\son\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:text)|url\s*\(/i.test(svg))fail_('Use um SVG sem scripts e recursos externos, ou envie PNG/JPG.');}
  return Utilities.newBlob(bytes,match[1],String(name).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,100));
}
function key_(id,resumeKey) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(id+':'+resumeKey,props_().getProperty('DOWNLOAD_SECRET'))).replace(/=+$/,''); }
function result_(found,key) { return {accepted:true,receiptId:found.values[0],downloadKey:key,emailSent:found.values[14]==='SIM'}; }
function register_(input) {
  return lock_(()=>{
    if(!/^[a-f0-9-]{36}$/i.test(String(input.id||''))||!/^[a-f0-9-]{36}$/i.test(String(input.resumeKey||'')))fail_('Identificador do cadastro inválido.');
    const previous=find_(input.id),key=key_(input.id,input.resumeKey);
    if(previous){if(!equal_(previous.values[13],sha_(input.resumeKey)))fail_('Não foi possível recuperar esse cadastro.');return result_(previous,key);}
    const state=plans_();if(input.revision!==state.revision)fail_('Os valores dos planos foram atualizados. Confira e confirme novamente.','PRICE_CHANGED');
    if(input.termsVersion!==Achadinhos.termsVersion||input.accepted!==true)fail_('Leia e aceite a versão atual do termo.');
    const data=validateData_(input.data||{}),plan=state.plans[data.plano];if(!plan.active||!Number.isSafeInteger(plan.annualCents))fail_('Plano indisponível.');
    if(!['draw','type'].includes(input.signatureMode))fail_('Assinatura inválida.');
    if(input.signatureMode==='type'&&Achadinhos.normalizeName(input.signatureText)!==Achadinhos.normalizeName(data.responsavel))fail_('A assinatura deve usar o nome do responsável.');
    const signature=imageBlob_(input.signature,'assinatura-'+input.id+'.png',false);
    let logo=null;if(input.logo)logo=imageBlob_(input.logo.data,'logo-'+input.id+'-'+clean_(input.logo.name,150,true),true);
    const p=props_(),day=Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyy-MM-dd'),quota=JSON.parse(p.getProperty('SUBMIT_QUOTA')||'{"day":"","count":0}');
    if(quota.day!==day){quota.day=day;quota.count=0;}const max=Number(p.getProperty('MAX_REGISTRATIONS_PER_DAY')||40);if(quota.count>=max)fail_('O limite diário de cadastros foi atingido. Entre em contato com nossa equipe.','RATE_LIMIT');quota.count++;p.setProperty('SUBMIT_QUOTA',JSON.stringify(quota));
    const record={id:input.id,createdAt:new Date().toISOString(),data,plan:{id:data.plano,annualCents:plan.annualCents,feeCents:plan.feeCents,totalCents:plan.annualCents+plan.feeCents,installments:12,durationMonths:12},termsVersion:Achadinhos.termsVersion,terms:Achadinhos.terms,acceptance:Achadinhos.acceptance,accepted:true,signatureMode:input.signatureMode,signatureText:input.signatureMode==='type'?clean_(input.signatureText,150,true):'',signatureHash:sha_(input.signature),logoName:logo?clean_(input.logo.name,150,true):null,logoHash:logo?sha_(input.logo.data):null};
    const recordText=JSON.stringify(record),hash=sha_(recordText),folder=folder_(),created=[];
    let found;
    try {
      const signatureFile=folder.createFile(signature);created.push(signatureFile);
      const logoFile=logo?folder.createFile(logo):null;if(logoFile)created.push(logoFile);
      const pdf=makePdf_(record,signature,hash),pdfFile=folder.createFile(pdf);created.push(pdfFile);
      const recordFile=folder.createFile(Utilities.newBlob(recordText,'application/json','registro-'+record.id+'.json'));created.push(recordFile);
      const row=[record.id,record.createdAt,safeCell_(data.nomeFantasia),data.plano,safeCell_(data.email),plan.annualCents,plan.feeCents,pdfFile.getId(),recordFile.getId(),logoFile?logoFile.getId():'',signatureFile.getId(),hash,sha_(key),sha_(input.resumeKey),'PENDENTE'];
      sheet_().appendRow(row);found=find_(record.id);
    } catch(error) {
      // Se a planilha já confirmou o protocolo, preserve todos os arquivos da adesão.
      const committed=find_(record.id);if(committed)found=committed;
      else {created.forEach(file=>{try{file.setTrashed(true);}catch(ignored){}});throw error;}
    }
    try{send_(found);found.values[14]='SIM';}catch(error){console.error('Cadastro '+record.id+': envio de e-mail pendente.');}
    return result_(found,key);
  });
}
function makePdf_(record,signature,hash) {
  const doc=DocumentApp.create('Termo — '+record.id),body=doc.getBody();
  try {
    body.setPageWidth(595.28).setPageHeight(841.89).setMarginTop(30).setMarginBottom(30).setMarginLeft(36).setMarginRight(36);
    body.setAttributes({[DocumentApp.Attribute.FONT_FAMILY]:'Arial',[DocumentApp.Attribute.FONT_SIZE]:9,[DocumentApp.Attribute.FOREGROUND_COLOR]:'#011743'});
    const title=text=>body.appendParagraph(text).setAttributes({[DocumentApp.Attribute.FONT_SIZE]:17,[DocumentApp.Attribute.BOLD]:true,[DocumentApp.Attribute.FOREGROUND_COLOR]:'#011743'}).setSpacingAfter(8);
    const section=text=>body.appendParagraph(text).setAttributes({[DocumentApp.Attribute.FONT_SIZE]:10,[DocumentApp.Attribute.BOLD]:true,[DocumentApp.Attribute.FOREGROUND_COLOR]:'#EE6810'}).setSpacingBefore(10).setSpacingAfter(5);
    const para=text=>body.appendParagraph(text).setAttributes({[DocumentApp.Attribute.FONT_FAMILY]:'Arial',[DocumentApp.Attribute.FONT_SIZE]:9,[DocumentApp.Attribute.FOREGROUND_COLOR]:'#011743'}).setSpacingAfter(5).setLineSpacing(1.05);
    title('ACHADINHOS DO CONDOMÍNIO');para('FORMULÁRIO DE CADASTRO E TERMO DE ADESÃO');para('PÁGINA 1 — CADASTRO E CONTRATAÇÃO');
    section('1. DADOS DA EMPRESA');
    const d=record.data,fields=[['Razão social',d.razaoSocial],['Nome fantasia',d.nomeFantasia],['CNPJ',d.cnpj],['Segmento de atuação',d.segmento],['Endereço completo',d.endereco],['Cidade/Estado',d.cidade+'/'+d.estado],['WhatsApp',d.whatsapp],['E-mail',d.email],['Instagram',d.instagram||'Não informado'],['Site',d.site||'Não informado'],['Responsável legal',d.responsavel],['CPF',d.cpf],['Cargo',d.cargo],['Logotipo da empresa',record.logoName||'Não anexado']];
    const table=body.appendTable(fields);table.setBorderColor('#dce5ef').setBorderWidth(.5);table.editAsText().setFontFamily('Arial').setFontSize(9).setForegroundColor('#011743');for(let i=0;i<table.getNumRows();i++){for(let j=0;j<2;j++)table.getRow(i).getCell(j).setPaddingTop(3).setPaddingBottom(3);table.getRow(i).getCell(0).setBackgroundColor('#f2f6fb').setWidth(145);table.getRow(i).getCell(0).editAsText().setBold(true);}
    section('2. PLANO CONTRATADO');para('Plano: '+d.plano+' | Vigência: 12 meses | Data de início: '+d.inicio.split('-').reverse().join('/'));
    para('Valor único do plano anual: '+Achadinhos.money(record.plan.annualCents));para('Parcelamento: '+Achadinhos.installments(record.plan.annualCents)+' no cartão de crédito');para('Taxa de adesão inicial: '+Achadinhos.money(record.plan.feeCents));para('Valor total (plano + adesão): '+Achadinhos.money(record.plan.totalCents));
    section('3. CONDIÇÕES DE PAGAMENTO');para('PLANO ANUAL — Cartão de crédito — valor único parcelado em 12 vezes.');para('A contratação corresponde a um valor único anual, dividido em 12 parcelas no cartão de crédito, não se tratando de mensalidades independentes.');para('TAXA DE ADESÃO INICIAL — Forma de pagamento: '+(d.pagamentoAdesao==='PIX'?'PIX':'Boleto bancário')+'. Chave PIX (CNPJ): 65.106.497/0001-72.');para('A taxa de adesão será cobrada separadamente do valor do plano anual.');
    body.appendPageBreak();title('TERMO DE ADESÃO');para('PÁGINA 2 — TERMO DE ADESÃO E ACEITE CONTRATUAL');
    record.terms.forEach(parts=>{section(parts[0]);parts.slice(1).forEach(para);});
    section('9. DECLARAÇÃO DE ACEITE ELETRÔNICO');para('ACEITO — '+record.acceptance);
    para('Nome do responsável: '+d.nomeAceite+' | CPF: '+d.cpfAceite);para('Data e hora do registro: '+Utilities.formatDate(new Date(record.createdAt),'America/Sao_Paulo','dd/MM/yyyy HH:mm:ss')+' (America/Sao_Paulo)');
    const image=body.appendImage(signature);image.setWidth(220).setHeight(66);para('Assinatura eletrônica '+(record.signatureMode==='type'?'digitada: '+record.signatureText:'desenhada pelo responsável.'));
    const footer=doc.addFooter();footer.appendParagraph('Protocolo: '+record.id+' | Versão do termo: '+record.termsVersion+'\nSHA-256 do registro: '+hash).setAttributes({[DocumentApp.Attribute.FONT_SIZE]:7,[DocumentApp.Attribute.FOREGROUND_COLOR]:'#64728a'});
    doc.saveAndClose();return DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF).setName('Achadinhos-termo-'+record.id+'.pdf');
  } finally { try{DriveApp.getFileById(doc.getId()).setTrashed(true);}catch(error){} }
}
function send_(found) {
  const row=found.values,record=JSON.parse(DriveApp.getFileById(row[8]).getBlob().getDataAsString()),pdf=DriveApp.getFileById(row[7]).getBlob();
  const owner=props_().getProperty('OWNER_EMAIL'),client=record.data.email,recipients=Array.from(new Set([owner,client]));
  if(MailApp.getRemainingDailyQuota()<recipients.length)fail_('Limite diário de e-mail atingido. O cadastro está registrado e pode ser reenviado depois.','MAIL_QUOTA');
  // Uma única mensagem com cópia oculta evita expor o e-mail de outros clientes.
  MailApp.sendEmail({to:client,bcc:owner===client?'':owner,subject:'Cadastro e termo de adesão — Achadinhos do Condomínio — '+record.id,body:'Olá, '+record.data.responsavel+'.\n\nSeu cadastro e termo de adesão ao Achadinhos do Condomínio foram registrados. A cópia em PDF segue anexada.\n\nEmpresa: '+record.data.nomeFantasia+'\nPlano: '+record.plan.id+'\nValor anual: '+Achadinhos.money(record.plan.annualCents)+'\nAdesão: '+Achadinhos.money(record.plan.feeCents)+'\nProtocolo: '+record.id+'\n\nAs instruções de pagamento serão encaminhadas pela equipe. Este cadastro não realiza cobranças.\n\nContato: grupomf7@gmail.com | (19) 99388-2224',name:'Achadinhos do Condomínio',replyTo:owner,attachments:[pdf]});
  sheet_().getRange(found.row,15).setValue('SIM');
}
function receipt_(data) {
  const found=find_(data.id);if(!found||!equal_(found.values[12],sha_(data.key||'')))fail_('Acesso ao PDF não autorizado.','UNAUTHORIZED');
  if(Date.now()-new Date(found.values[1]).getTime()>7*24*3600000)fail_('O acesso de download expirou. Use a cópia enviada ao seu e-mail.','EXPIRED');
  const blob=DriveApp.getFileById(found.values[7]).getBlob();return {base64:Utilities.base64Encode(blob.getBytes()),name:blob.getName()};
}
function list_() { const sheet=sheet_();if(sheet.getLastRow()<2)return [];const start=Math.max(2,sheet.getLastRow()-19);return sheet.getRange(start,1,sheet.getLastRow()-start+1,HEADERS.length).getValues().reverse().map(row=>({id:row[0],createdAt:row[1],company:row[2],plan:row[3],email:row[4],pdfUrl:'https://drive.google.com/file/d/'+row[7]+'/view',emailSent:row[14]==='SIM'})); }
function resend_(id) { return lock_(()=>{const found=find_(id);if(!found)fail_('Cadastro não encontrado.');if(found.values[14]==='SIM')return {ok:true};send_(found);return {ok:true};}); }
