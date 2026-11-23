# Histórico de alterações

## [0.3.3-lab] — 2026-11-23 (laboratório experimental)

- IA aliada e torres hostis com disparos, alcance, cooldown, munição e verificação simplificada de linha de visão.
- Detecção de alvos, priorização de inimigo marcado, ataques de bots e reação de defesa.
- Interface de seleção múltipla de aliados, comandos Atacar, Defender, Seguir e Cessar fogo.
- Projéteis atingem entidades de facções opostas; vida, eliminação, pontuação e histórico de eventos.
- Salvar/importar/exportar JSON com `missionScore`, `squadSelection` e estatísticas individuais.
- Módulo testável `src/lab/combat.mjs` e testes de regressão `tests/combat.test.mjs`.
- Limitações: IA arcade, inimigos estáticos, ausência de movimentação tática elaborada e de teste visual completo no navegador.

## [0.3.2-lab] — 2026-11-23 (experimental, laboratório separado)

- Navegação A* em grade com desvio de construções e tanques estacionados.
- Suavização de rotas, prevenção de corte de cantos e replanejamento limitado.
- Traçado da rota no mapa tático M para a unidade selecionada.
- Postos de tanque e helicóptero com ocupantes individuais e validação de duplicidade.
- Painel móvel de tripulação com troca de posto e impedimento de sobrescrita de ocupantes.
- Persistência dos ocupantes no JSON; migração de saves antigos.
- Testes unitários de navegação, tripulação e colisões executados no GitHub Actions.
- Entrada e saída de helicópteros bloqueadas em voo; desembarque de veículos em movimento bloqueado.
- Bots continuam simulando enquanto o mapa M está aberto.
- Limites: sem pathfinding 3D, IA de combate, animação de tripulantes, física rígida ou integração ao jogo principal.

## [0.3.1-lab] — 2026-11-23 (experimental)
- Segundo soldado aliado independente, selecionável pela tecla 4, com ordem padrão Seguir.
- Colisão 2D simples para edificações e blindados; evita atravessar volumes.
- Desembarque com busca de posição segura e distinção entre controle remoto e embarque.
- Migração de saves antigos da v0.3.0 para incluir a nova entidade.
- Módulo puro de geometria e testes unitários Node.js executados no GitHub Actions.
- Ainda sem pathfinding, física rígida ou integração ao jogo principal.

## [0.3.0-lab] — 2026-11-23 (experimental e separado)

- Publicado `unit-control-lab.html` e `src/lab/unit-control.js`.
- Soldado em terceira pessoa com movimentos, pulo, agachar, recarga e disparo de treinamento.
- Tanque e helicóptero com identidade persistente, controle remoto e interação de embarque/desembarque.
- Postos de motorista/atirador/comandante e piloto/atirador de porta.
- Bots aliados com ordens de manter, patrulhar e seguir (movimento simples).
- Mapa tático, painel de depuração, salvar/importar/exportar JSON e painéis móveis.
- Manual próprio e verificação sintática no GitHub Actions.
- Sem integração ao jogo principal; não é versão final de veículos ou IA.

## [0.2.0] — 2026-11-23

- Acrescentadas cinco classes controláveis: soldado, artilharia, avião, submarino e APC.
- Oito unidades independentes coexistem no cenário, com posição, vida e recarga preservadas durante a troca.
- Teclas 1–8 e painel de seleção. Câmera próxima de terceira pessoa para soldado.
- Arquivos JSON individuais de todas as unidades em data/units.
- Movimento arcade por classe, profundidade do submarino e altitude do avião.
- Transferência automática de controle quando a unidade ativa é destruída e há sobreviventes.
- Limitações: modelos primitivos, armas e movimentação simplificadas, unidades não assumidas paradas, ainda sem embarque e desembarque físico.

## [0.1.0] — 2026-11-23

- Publicação do protótipo Operação Tempestade fornecido pelo usuário.
- Marca WMK Combined Arms, contato e versão na interface.
- Documentação HTML com manual e roadmap.
- Licença MIT e README em português.
- Painel de configuração gráfica com persistência local (tecla O).

## Próximos passos

Consultar [roadmap.html](roadmap.html). Funcionalidades futuras não devem ser tratadas como implementadas.
