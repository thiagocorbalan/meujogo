---
name: executar-issue
description: Executa uma issue COR-NN do Linear do Meu Jogo do começo ao fim, seguindo o workflow de execução do hub — confere a Definition of Ready, lê as fontes da spec e a doc oficial das libs, cria a branch, faz TDD, roda o gate, abre a PR e para nas verificações manuais do Thiago (V1 plano, V2 preview) antes de qualquer merge. Use quando pedirem "executa a COR-NN", "pega a próxima issue", "implementa a issue X" ou "/executar-issue COR-NN".
---

# Executar uma issue do Meu Jogo

O documento que manda é `doc/meujogo/tecnico/workflow-de-execucao.md`. Leia-o inteiro antes do passo 1 e siga-o; esta skill é o roteiro operacional dele. Convenções de código: `doc/meujogo/tecnico/arquitetura-v2.md`.

Argumento: o identificador da issue (`COR-NN`). Sem argumento, pergunte qual issue.

## Passos

1. **Linear certo.** Use só as ferramentas `mcp__linear-meujogo__*`. Chame `get_workspace` e confirme o nome "Corbalan's Dev"; se for outro, pare. Nunca use o MCP `linear` (é de outra empresa).
2. **Ler a issue.** `get_issue` com relações. Se o executor for "Thiago", diga isso e pare. Se houver issue bloqueante aberta, diga qual e pare.
3. **Definition of Ready.** Confira as nove seções do workflow §2 (Contexto, Fontes do hub, Fontes oficiais das libs, Escopo e fora de escopo, Critérios de aceite, Testes automatizados, Verificação manual, Dependências, Execução). Faltou alguma: comente na issue o que falta e pare.
4. **Fontes.** Leia cada fonte do hub citada (a seção inteira da spec, não só a RN) e cada página oficial citada, conferindo antes a versão da lib no `package.json`. Se a spec, a issue e o código discordarem, comente a dúvida na issue e pare.
5. **Branch.** `git fetch` e branch a partir da `origin/main` com o `gitBranchName` da issue. Mova a issue para In Progress.
6. **Plano.** Escreva um plano curto (arquivos, testes, riscos) como comentário na issue. Se a issue pede V1 ou é Urgent: avise o Thiago e **pare até ele aprovar**.
7. **TDD.** Para cada critério de aceite: teste que falha, código mínimo, refatora. Regras de cálculo vão para `packages/engines`; contratos para `packages/shared`; componentes para `packages/ui`.
8. **Gate local.** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Corrija até ficar verde; não desligue regra nem pule teste.
9. **Autorrevisão.** Rode a skill `code-review` contra a `main` e corrija o que for real.
10. **PR.** Push da branch e `gh pr create` com: resumo, `Closes COR-NN`, fontes usadas, o que os testes cobrem e o roteiro de **Verificação manual** copiado da issue. Termine o corpo com a linha de atribuição pedida no sistema.
11. **Esperar o CI** e o preview. Mova a issue para In Review e comente o link da PR e do preview.
12. **V2.** Avise o Thiago com o roteiro e **pare**. Não faça merge sem o "ok" dele.
13. **Depois do ok.** Rebase na `origin/main` (avise antes de `--force-with-lease`), `gh pr merge --squash --delete-branch`, issue em Done com um comentário curto do que entrou. Se a issue mudou regra, contrato ou convenção, atualize o doc do hub (com `atualizado` no frontmatter).

## Nunca

- Inventar regra que não está na spec, ou ampliar o escopo.
- Push na `main`, merge sem V2, `--force` sem avisar, `--no-verify`.
- Comentário de código citando issue, spec, data ou histórico.
- Segredo em código, log, PR ou comentário.
