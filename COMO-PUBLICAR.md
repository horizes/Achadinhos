# Colocar o Achadinhos no GitHub Pages

A plataforma abre **sem login** e tem apresentação profissional, sem avisos de teste. Inclui calendário interativo, cadastro por categorias e contrato em PDF.

1. Extraia **achadinhos-github-pages-v4.zip**.
2. Crie um repositório no GitHub, por exemplo **achadinhos-plataforma**. No plano gratuito, escolha **Public**.
3. Clique **Add file → Upload files** e envie o conteúdo extraído. Mantenha `index.html` na raiz e envie também `config.js`, `logo.png`, `.nojekyll` e a pasta `assets`.
4. Clique **Commit changes**.
5. Vá em **Settings → Pages**.
6. Selecione **Deploy from a branch → main → /(root)** e salve.
7. Aguarde a publicação e abra o link que aparece em Pages.

Não é para enviar apenas o ZIP. É para enviar os arquivos que estão dentro dele. Também não coloque tudo dentro de uma pasta extra no repositório.

Somente o formulário de contrato cria cadastros em **Clientes e interesses**. A agenda guarda nome e contato apenas na própria reunião.

O link de agendamento fica em **Reuniões**; o formulário de parceria fica em **Contratos**. Para apresentar, abra esses links em outra aba **do mesmo navegador**. Use dados fictícios. Depois consulte **Reuniões**, **Contratos** e **Clientes e interesses** no painel. No calendário, alterne entre mês e semana e clique numa data para ver compromissos e horários.

No modo de teste, os dados ficam salvos neste navegador. Outra pessoa, em outro dispositivo, terá uma demonstração separada. O WhatsApp permanece desligado; o PDF pode ser baixado.

O login da equipe e o banco compartilhado estão no ZIP **achadinhos-codigo-completo-v4.zip**. O cliente continuará sem login. O guia **LEIA-ME.md** do código completo mostra como ativar Supabase e WhatsApp depois.

Se a página aparecer em branco, confirme que a pasta `assets` também foi enviada. Se a atualização não aparecer, aguarde a publicação e recarregue com **Ctrl + F5**.

O [guia oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) detalha a publicação.
