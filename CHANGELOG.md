# Histórico de alterações

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
