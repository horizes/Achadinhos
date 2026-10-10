# Achadinhos do Condomínio — versão de teste

O site mantém o cadastro e o termo em duas etapas, as cores #EE6810 e #011743, a assinatura no celular e o painel separado. O envio de e-mails e o serviço de cadastro ficaram para depois, conforme solicitado.

## Entrar no admin

Acrescente `admin.html` ao endereço do site. Exemplo:

`https://SEU-USUARIO.github.io/SEU-REPOSITORIO/admin.html`

**Senha de teste: 123456**

Não há link para o painel na página pública. Para testar o login, não é necessário configurar Google, Resend ou qualquer servidor.

## Testar os planos

1. Entre no painel com a senha 123456.
2. Informe o valor anual e a taxa de adesão dos planos que quiser testar.
3. Marque “Disponível para contratação” e clique em “SALVAR PLANOS DE TESTE”. Planos desativados podem ficar sem preço.
4. Abra o cadastro no mesmo navegador. Os valores salvos aparecerão nas opções BLUE, TOP e BLACK. Abas abertas no mesmo site também acompanham as alterações.
5. Use a área de geração de links para copiar o endereço público, com um plano pré-selecionado se desejar.

Os valores deste protótipo ficam **somente neste navegador**. A sincronização dos preços entre outros aparelhos será feita quando o serviço for configurado. Nenhum dado de cliente é armazenado ou enviado neste teste. O botão de confirmar informa que a integração está pendente. E-mails, PDFs de contratos e cobrança ainda não são executados nesta versão de teste.

## Logos

- `assets/plano-top-2743cb2341a5.png`: nova logo TOP fornecida pelo usuário, com interior laranja e monograma dourado; fundo branco externo removido.
- `assets/plano-black-b246eeca9d5e.png`: logo fornecida, com o fundo exterior removido.
- `assets/plano-blue-3bee747f44aa.png`: logo BLUE fornecida pelo usuário, com letras azuis e aro laranja; fundo preto externo removido.
- As três imagens têm transparência real fora do medalhão; o interior de cada logo foi mantido opaco.
- As logos aparecem nos planos do cadastro e nos cartões de administração.
- As logos enviadas estão no cadastro e no admin. O recorte da TOP foi refeito para corrigir falhas de transparência no interior e resíduos externos. Os arquivos das imagens têm nomes novos e o script do admin inclui uma versão na URL para evitar o cache das versões anteriores. O histórico de edição está em `PROMPTS-DAS-LOGOS.md`.

## Atualizar no GitHub Pages

Extraia o ZIP e substitua os arquivos no repositório pelo conteúdo do pacote, incluindo `demo.js` e as imagens em `assets/`. O `index.html` deve ficar na raiz. O site continua sem etapa de build. Substitua também `admin.html` e `admin.js`. Após a publicação terminar, reabra `admin.html` e use Ctrl+F5 para atualizar a página.

O CNPJ fixo de pagamento continua como `00.000.000/0000-00`.

## Verificação

Foram conferidos: a senha correta e incorreta, o acesso do painel, o salvamento dos preços em outras abas, a persistência após reabrir o site, conflitos entre alterações, logout, ausência de armazenamento de dados de clientes e sintaxe dos scripts. As referências de arquivos, a transparência das imagens e a integridade do ZIP também foram verificadas. A renderização do site em um navegador não foi conferida neste ambiente.

## Quando retomar a integração

O modo de teste é controlado por `demoMode: true` em `config.js`. Essa senha está no código do protótipo e serve apenas para testar a interface. Na integração definitiva, `demoMode` será desativado e o acesso será validado pelo servidor. Não basta trocar a senha do protótipo para obter autenticação real.
