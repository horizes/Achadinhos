# Achadinhos do Condomínio — cadastro e administração

Site estático para GitHub Pages, com formulário em duas etapas, assinatura no celular e painel administrativo separado. Cores: laranja `#EE6810` e azul-marinho `#011743`.

## O que está entregue

- `index.html`: dados da empresa, anexo do logotipo, plano, condições de pagamento, termo integral e aceite.
- `admin.html`: login com senha verificada no servidor, preços anuais e taxas de adesão dos planos BLUE, TOP e BLACK, ativação/desativação, geração do link e últimos 20 cadastros.
- Assinatura desenhada com dedo/mouse ou digitada como alternativa acessível.
- Backend Google Apps Script: valores centrais, validação do cadastro, PDF com assinatura, arquivo do registro, planilha de cadastros e e-mail com PDF para cliente e administrador.
- Logotipo fornecido, com o fundo externo removido e transparência real, em `assets/logo-transparente.png`.

Não há link para o painel na página de cadastro. A proteção dos dados e das alterações depende da senha e da sessão verificadas no servidor; conhecer o endereço `admin.html` não dá acesso às operações administrativas.

## Estado atual

Os arquivos estão preparados, mas **não foram publicados nem conectados à sua conta Google**. O `apiUrl` está vazio. Os preços não foram inventados: serão definidos no painel após a ativação. Até lá, a página não confirma cadastros nem promete envio de e-mail.

GitHub Pages hospeda os arquivos do site. O Google Apps Script executa as operações de servidor e usa a conta Google escolhida para Drive, planilha, PDF e e-mail. Essa conta precisa autorizar o script.

## 1. Publicar os arquivos no GitHub Pages

1. Crie ou escolha um repositório no GitHub.
2. Envie **o conteúdo da pasta `achadinhos-site`** para a raiz do repositório. O arquivo `index.html` precisa ficar na raiz, junto com `admin.html`, scripts, CSS, `.nojekyll` e `assets/`.
3. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e pasta **/(root)**. Salve.
4. Aguarde a publicação e anote o endereço mostrado pelo GitHub. Exemplo: `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

Não há npm, build, framework ou biblioteca externa para instalar. Os caminhos dos arquivos são relativos, compatíveis com sites publicados em uma subpasta de repositório.

Referência: [publicar a partir de uma branch — GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 2. Ativar o Google Apps Script

1. Entre na conta Google que será responsável pelos cadastros e abra [Google Apps Script](https://script.google.com/).
2. Crie um projeto chamado **Achadinhos — cadastro e adesão**.
3. No arquivo `Code.gs`, cole o conteúdo de `backend/Code.gs` do pacote.
4. Adicione outro arquivo de script chamado **Core** e cole `backend/Core.gs`. Esse arquivo contém os textos contratuais e os cálculos compartilhados com o site.
5. Em **Configurações do projeto**, habilite a exibição do manifesto `appsscript.json`. Substitua seu conteúdo pelo arquivo `backend/appsscript.json`.
6. Ainda nas configurações, em **Propriedades do script**, cadastre:

| Propriedade | Valor |
| --- | --- |
| `ADMIN_PASSWORD` | Sua senha administrativa, única e com pelo menos 16 caracteres. Configure diretamente no Google; não coloque em `config.js` nem no GitHub. |
| `OWNER_EMAIL` | E-mail que receberá a cópia de todos os termos. Se for o e-mail informado no pedido, use `grupomf7@gmail.com`. |
| `SITE_ORIGIN` | Somente a origem do site. Exemplo: `https://SEU-USUARIO.github.io`. Sem barra final e sem o nome do repositório. |

7. No editor, selecione a função **setup** e clique em **Executar**. Autorize o acesso solicitado à sua conta. A função cria uma pasta privada e uma planilha, e não envia e-mails de teste. As URLs aparecem no log de execução.
8. Clique em **Implantar → Nova implantação**. Selecione **Aplicativo da Web**, executar como **Eu** e acesso **Qualquer pessoa**. Essas opções permitem que uma cliente preencha sem entrar em uma conta Google. Se a organização bloquear aplicativos públicos, será necessário liberar esse tipo de implantação ou usar outro backend.
9. Copie a URL do aplicativo da Web, terminada em **`/exec`**. Não use a URL `/dev`.

Referências: [aplicativos da Web no Apps Script](https://developers.google.com/apps-script/guides/web), [envio de e-mail com anexo](https://developers.google.com/apps-script/reference/mail/mail-app).

## 3. Conectar o site ao serviço

Edite `config.js` no repositório:

```js
window.ACHADINHOS_CONFIG = Object.freeze({
  apiUrl: "https://script.google.com/macros/s/ID-DA-IMPLANTACAO/exec",
  siteUrl: "https://SEU-USUARIO.github.io/SEU-REPOSITORIO/",
  whatsapp: "5519993882224",
  email: "grupomf7@gmail.com"
});
```

Salve no GitHub e aguarde a atualização do Pages. O campo `apiUrl` é público e não é uma senha. As únicas credenciais ficam nas Propriedades do script. Não envie arquivos com senhas para o repositório.

O transporte usa um formulário POST em um iframe invisível, com resposta por `postMessage` para a origem configurada. Isso evita depender de suporte a CORS no Apps Script. As respostas são correlacionadas por identificador aleatório; a origem também é conferida no navegador. As rotas administrativas exigem uma sessão válida, além dessa conferência.

## 4. Definir os preços e gerar seu link

1. Acesse `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/admin.html` diretamente.
2. Entre com a senha definida em `ADMIN_PASSWORD`.
3. Informe o valor único anual e a taxa de adesão de **cada um dos três planos**. Taxa zero é permitida; o plano anual deve ser maior que zero.
4. Marque os planos disponíveis e clique em **SALVAR PARA TODOS**.
5. Em **Gerar link de cadastro**, confira o endereço público e escolha um plano pré-selecionado, ou deixe a cliente escolher.
6. Clique em **COPIAR LINK** ou **WHATSAPP** para abrir uma mensagem pronta e selecionar a destinatária.

Exemplo de link: `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/?plano=TOP`. O link não contém senha ou preços. Qualquer cliente que abrir o formulário carregará os valores atuais do servidor. Uma cliente pode escolher outro plano disponível.

Se os valores mudarem enquanto alguém preenche, a confirmação com a versão antiga será recusada. O formulário carrega os novos valores e pede um novo aceite. Contratos já registrados preservam seu plano e seus valores originais.

## 5. Testar antes de enviar às clientes

Use dados de uma empresa de teste e um e-mail seu para conferir o fluxo real:

1. Abra o link em um celular e em um computador; confira o formulário e a logo.
2. Preencha os dados, selecione o plano, a data de início e PIX ou boleto.
3. Leia o termo, marque o aceite e desenhe a assinatura ou digite o nome do responsável.
4. Confirme. Aguarde o protocolo e baixe o PDF.
5. Confira a cópia no e-mail da cliente de teste e no e-mail do administrador, inclusive na pasta de spam.
6. Confira o cadastro na planilha e no painel, e abra o PDF para revisar diagramação, valores, texto e assinatura.
7. Altere um preço no painel e abra um novo link: o valor atualizado deve aparecer para todos.

Quando o serviço de e-mail não concluir o envio, o cadastro continua registrado e o painel mostra **Reenviar**. O botão tenta enviar a cópia pendente novamente. Uma resposta de sucesso do Google indica envio aceito pelo serviço; a entrega à caixa de entrada depende do provedor do destinatário.

## Dados, PDF e pagamento

O servidor guarda na pasta privada: PDF, assinatura PNG, logotipo anexado e registro JSON. A planilha contém o protocolo e referências a esses arquivos. O PDF registra empresa, valores, condições de pagamento, texto contratual, aceite, assinatura e data/hora do servidor em `America/Sao_Paulo`.

O download no navegador exige uma chave aleatória e expira após sete dias. Os arquivos do Drive não são tornados públicos. O administrador abre os arquivos estando conectado à conta Google proprietária. A cliente recebe o PDF como anexo de e-mail.

O registro contém a versão do termo e um SHA-256, que permite comparar o conteúdo arquivado. A assinatura registra o desenho ou o nome digitado; esta implementação não usa certificado ICP-Brasil nem faz verificação documental da identidade.

O site **não cobra o cartão, não cria um PIX e não emite boleto**. Ele registra a contratação e a forma de pagamento. A equipe deve enviar as instruções ou o link de pagamento. Configure o provedor financeiro para uma compra anual parcelada em 12 vezes, conforme solicitado. Centavos que não se dividem igualmente por 12 são distribuídos entre as parcelas, preservando o total anual.

Os campos públicos não armazenam CPF, endereço ou assinatura em `localStorage`. O formulário preenchido fica apenas na memória enquanto a página está aberta. Recarregar antes do envio apaga o preenchimento; após enviar, preserve o PDF recebido.

O Google Apps Script tem limites de execução, armazenamento, conversão e envio. O backend também aplica limite de 40 cadastros por dia e bloqueia o login após 12 falhas em 15 minutos. Para alterar o limite próprio de cadastro, use a propriedade `MAX_REGISTRATIONS_PER_DAY`. O uso dessas proteções não elimina a necessidade de acompanhar abusos em um formulário público. Consulte [as cotas oficiais do Apps Script](https://developers.google.com/apps-script/guides/services/quotas) se o volume aumentar.

## Atualização do texto contratual

Os textos fornecidos foram mantidos. Se houver revisão, altere `core.js` no site e replique o mesmo conteúdo em `backend/Core.gs`, atualizando `termsVersion`. Publique uma nova versão da implantação Apps Script e atualize o site. Uma cliente só confirma quando a versão do termo coincide com a do servidor.

Conforme a observação fornecida no pedido, faça revisão jurídica das condições de cancelamento antecipado e renovação automática antes da disponibilização comercial. A aplicação registra essas cláusulas e não executa cobrança ou renovação financeira automática.

## Verificação realizada

Foram aprovados 16 testes locais da lógica, com os serviços Google simulados: validação de valores e CPF, centavos do parcelamento, senha e sessão, proteção das rotas administrativas, alteração central dos planos, conflito entre edições, rejeição de preço antigo, validação do aceite, protocolo único, retomada sem duplicidade, chave de PDF, falha de e-mail e reenvio, limpeza após falha do PDF, origem da resposta e consistência do texto entre site e servidor. Também foi conferida a sintaxe JavaScript e a transparência PNG da logo.

A prévia HTTP local não ficou acessível neste ambiente. Por isso, a verificação visual no navegador/celular e a diagramação do PDF produzido pelo Google ainda precisam do teste de ativação descrito acima. Nenhum cadastro foi enviado a uma conta real e nenhum e-mail foi disparado durante o desenvolvimento.

## Logo

O arquivo `assets/logo-transparente.png` foi produzido com a ferramenta integrada ImageGen a partir da logo anexada. Prompt: remover apenas o fundo branco externo e a sombra fora do círculo; manter o círculo azul, a borda laranja, os elementos e o texto **ACHADINHOS DO CONDOMÍNIO**, com transparência real e sem redesenhar a marca.
