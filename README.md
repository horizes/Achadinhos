# Achadinhos do Condomínio — versão de teste

O painel administrativo é a página inicial do site. O cadastro e o termo em duas etapas ficam na página secundária `cadastro.html`, com as cores #EE6810 e #011743 e a assinatura no celular. O envio de e-mails e o serviço de cadastro ficaram para depois, conforme solicitado.

## Entrar no admin

Abra o endereço principal do site. Exemplo:

`https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`

**Senha de teste: 123456**

Não há link para o painel na página pública. Para testar o login, não é necessário configurar Google, Resend ou qualquer servidor.

O endereço antigo `admin.html` redireciona para a página inicial.

## Página do cliente

Envie o endereço da página secundária:

`https://SEU-USUARIO.github.io/SEU-REPOSITORIO/cadastro.html`

O gerador do painel sempre cria o link para `cadastro.html`, mesmo quando você informa o endereço principal ou `index.html`. O plano pré-selecionado continua no parâmetro `?plano=BLUE`, `?plano=TOP` ou `?plano=BLACK`. A mensagem para WhatsApp usa esse mesmo endereço do cliente.

## Testar os planos

1. Entre no painel com a senha 123456.
2. Informe o valor anual e a taxa de adesão dos planos que quiser testar.
3. Marque “Disponível para contratação” e clique em “SALVAR PLANOS DE TESTE”. Planos desativados podem ficar sem preço.
4. Abra `cadastro.html` no mesmo navegador. Os valores salvos aparecerão nas opções BLUE, TOP e BLACK. Abas abertas no mesmo site também acompanham as alterações.
5. Use a área de geração de links para copiar o endereço do cliente, com um plano pré-selecionado se desejar.

Os valores deste protótipo ficam **somente neste navegador**. A sincronização dos preços entre outros aparelhos será feita quando o serviço for configurado. Nenhum dado de cliente é armazenado ou enviado neste teste. O botão de confirmar informa que a integração está pendente. E-mails, PDFs de contratos e cobrança ainda não são executados nesta versão de teste.

## Logos

- `assets/plano-top-2743cb2341a5.png`: nova logo TOP fornecida pelo usuário, com interior laranja e monograma dourado; fundo branco externo removido.
- `assets/plano-black-09d0106dda8f.png`: logo fornecida, com o fundo exterior removido.
- `assets/plano-blue-3bee747f44aa.png`: logo BLUE fornecida pelo usuário, com letras azuis e aro laranja; fundo preto externo removido.
- As três imagens têm transparência real fora do medalhão; o interior de cada logo foi mantido opaco.
- As logos aparecem nos planos do cadastro e nos cartões de administração.
- As logos enviadas estão no cadastro e no admin. O recorte da TOP foi refeito para corrigir falhas de transparência no interior e resíduos externos. Os arquivos das imagens têm nomes novos e o script do admin inclui uma versão na URL para evitar o cache das versões anteriores. O histórico de edição está em `PROMPTS-DAS-LOGOS.md`.

## Atualizar no GitHub Pages

Extraia o ZIP e substitua os arquivos no repositório pelo conteúdo do pacote, incluindo `index.html` (admin), `cadastro.html` (cliente), `admin.html` (redirecionamento), os scripts e as imagens em `assets/`. Os três arquivos HTML devem ficar na raiz. O site continua sem etapa de build. Após a publicação terminar, abra o endereço principal e use Ctrl+F5 para atualizar a página.

O CNPJ fixo de pagamento continua como `00.000.000/0000-00`.

## Verificação

Foram conferidos: a senha correta e incorreta, o acesso do painel, o salvamento dos preços em outras abas, a persistência após reabrir o site, conflitos entre alterações, logout, ausência de armazenamento de dados de clientes e sintaxe dos scripts. Os links gerados para o cliente foram testados com endereço principal, endereço sem barra final, index.html, admin.html, cadastro.html e plano pré-selecionado; a mensagem de WhatsApp usa o mesmo link. As referências de arquivos, a transparência das imagens e a integridade do ZIP também foram verificadas. A renderização do site em um navegador não foi conferida neste ambiente.

## Quando retomar a integração

O modo de teste é controlado por `demoMode: true` em `config.js`. Essa senha está no código do protótipo e serve apenas para testar a interface. Na integração definitiva, `demoMode` será desativado e o acesso será validado pelo servidor. Não basta trocar a senha do protótipo para obter autenticação real.
