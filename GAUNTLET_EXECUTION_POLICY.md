# Gauntlet Execution Policy — Material Outcome Required

Esta política registra a instrução operacional mais recente do proprietário do repositório e **prevalece sobre cláusulas conflitantes de `GAUNTLET.md` que permitam encerrar uma execução saudável em NO-OP**.

O princípio de valor continua intacto: não criar commits vazios, cosméticos, de contador, SHA, CI, log, comentário, documentação rotineira ou atividade artificial. O que muda é o comportamento de busca: uma investigação que não encontrou valor ainda **não encerra uma execução saudável**.

## Regra principal

Uma execução é **HEALTHY** quando:

- o HEAD de `main` foi determinado;
- o CI/Playwright exigido do HEAD está concluído e saudável;
- não existe regressão prioritária pendente que precise ser corrigida primeiro;
- a integração possui leitura e escrita suficientes para realizar e validar uma mudança material.

Toda execução HEALTHY deve terminar com **uma mudança material integrada e um novo commit em `main`**.

`NO-OP` deixa de ser resultado terminal para execução HEALTHY. Se a primeira hipótese falhar no Evidence Gate ou no Value Case, o agente deve continuar a investigação na mesma execução.

## Únicas exceções sem commit

Uma execução pode terminar sem commit somente como **BLOCKED**, com evidência objetiva, quando pelo menos uma destas condições existir:

1. CI/Playwright do HEAD ainda está pendente/queued/in progress e o Gate 1 proíbe alteração;
2. falha de infraestrutura/flaky/preexistente impede estabelecer baseline confiável e não existe correção segura atribuível ao repositório;
3. permissões, indisponibilidade da integração ou limitação real de ferramenta impedem escrever ou validar com segurança;
4. conflito externo simultâneo torna inseguro atualizar a branch/`main` naquele ciclo.

Regressão causada pelo HEAD **não é BLOCKED**: deve ser corrigida exclusivamente e gerar commit material quando tecnicamente possível.

## Escada obrigatória de descoberta

Quando uma hipótese não passar, continuar sem encerrar:

1. priorizar itens `validated`, `experiment` ou `strategic` ainda não resolvidos em `VALUE_BACKLOG.md`;
2. revisar evidências recentes da issue #1 e contratos alterados nos commits mais recentes;
3. trocar FOCAL por SYSTEMIC quando o problema puder atravessar subsistemas ou quando duas hipóteses focais falharem;
4. investigar, em ordem, core/game feel, progressão/ritmo, decisões/replayability, flow/lifecycle, UX/mobile, acessibilidade e robustez observável;
5. usar simulações determinísticas/Playwright para procurar plateau, escolha falsa, regra invisível, pacing ocioso, risco sem recompensa, recompensa sem decisão e baixa perceptibilidade;
6. se um DESIGN/MACRO experimental for rejeitado, registrar a rejeição e continuar para a próxima oportunidade defensável na mesma execução em vez de terminar sem commit.

Não existe limite artificial de “uma hipótese investigada”. A atomicidade continua sendo **uma mudança material integrada por execução**, não uma única tentativa de descoberta.

## Fallback de capacidade

Uma melhoria de arquitetura, testes ou tooling só pode ser o resultado material do ciclo quando houver limite concreto que esteja bloqueando a evolução de produto ou validação segura. Não vale como fallback automático para fabricar commit.

Exemplo válido: remover uma limitação real da integração/harness que impedia editar ou testar um contrato de gameplay já validado. Exemplo inválido: reorganizar arquivos ou adicionar testes redundantes apenas porque nenhuma feature foi encontrada.

## Regra de backlog contínuo

Depois de integrar a mudança escolhida, a execução deve deixar `VALUE_BACKLOG.md` com o conhecimento estratégico material descoberto. Sempre que possível, manter próximas perguntas falsificáveis suficientemente concretas para a execução seguinte, sem transformá-las em features obrigatórias.

A ausência de evidência externa não justifica sozinha BLOCKED ou NO-OP. Evidência interna forte e falsificável continua suficiente para DESIGN/MACRO.

## Integração e qualidade

MICRO, DESIGN e MACRO continuam sujeitos aos Gates de evidência, valor e correctness definidos em `GAUNTLET.md`.

- MICRO: somente problema realmente isolado.
- DESIGN: modo normal de evolução do produto.
- MACRO: transformação coerente de pilar, com Discovery/Integration Gates completos.
- BLOCKED: única saída sem commit e apenas pelos bloqueios objetivos acima.

Uma execução HEALTHY nunca deve criar commit apenas para satisfazer esta política. Ela deve **continuar procurando até encontrar a mudança material de maior impacto defensável que passe os gates**.

## Registro final

A issue #1 deve registrar `MICRO`, `DESIGN`, `MACRO` ou `BLOCKED`; HEAD inicial/final; CI; lente; evidências; Value Case; testes; Correctness Gate; Value Judge; ganho perceptível; complexidade; rollback e alterações materiais de memória/backlog.

Para HEALTHY, o registro deve incluir o SHA material integrado em `main`. Para BLOCKED, deve incluir a evidência objetiva do bloqueio e nenhuma alegação de sucesso.
