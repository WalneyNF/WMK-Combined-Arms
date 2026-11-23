# WMK Combined Arms 🎮

**Protótipo de combate militar 3D no navegador, em português.** Helicóptero, tanque e navio, ilha procedural, combate contra inimigos, mira, radar, mísseis e missões.

**Versão:** 0.2.0 · **Autor das adaptações WMK:** Walney Moreira Klein — walneyk@hotmail.com

## 🎮 WMK Unit Control Lab v0.3.6 (experimental)

**[Abrir laboratório](unit-control-lab.html)** · [Manual completo](manuais/unit-control-lab.html)

Protótipo independente com dois soldados em terceira pessoa, tanque e helicóptero persistentes, entrada/saída com E, postos de veículo por F, disparos de treinamento, comandos básicos a bots, mapa tático M, modo de depuração e save/import/export JSON. Controles: WASD, Shift, mouse/K, E, F, R, Q/C no helicóptero, M para mapa, 1/2/3/4 para assumir unidades remotamente.

> O jogo principal continua na v0.2.0 e permanece preservado. O laboratório v0.3.5 é uma experiência separada: os sistemas ainda não estão integrados ao index.html. Bots possuem navegação A* e combate arcade básico, sem IA estratégica avançada; há colisões simplificadas com construções e veículos terrestres; ainda não há animação física de tripulantes, física realista, multiplayer nem modelos GLB.

**Novidades v0.3.6:** o [Editor de Missões](mission-editor.html) agora possui modo **Unidades / Spawn**, com seleção de soldados, tanques, helicópteros e alvos fixos; escolha de facção aliada/inimiga; propriedades individuais (ID, nome, coordenadas, altitude, rotação, HP, munição e ordem inicial); duplicação com novo ID; exclusão protegida para unidades vinculadas a objetivos; edição de posicionamento clicando no mapa. As entidades são exportadas no JSON e instanciadas realmente no laboratório ao clicar **Testar missão**. Até 40 unidades por cenário, com validação de IDs e vínculos. Arquivos: `src/lab/scenario.mjs`, `tests/scenario.test.mjs`.

**Novidades v0.3.5:** [WMK Mission Studio](mission-editor.html) com editor visual e mapa clicável, modelos Patrulha/Defesa/Escolta, objetivos de eliminar, capturar, defender e escoltar, importação/exportação JSON e botão para testar diretamente no laboratório. O painel de objetivos do laboratório acompanha progresso, conclusão e fracasso e inclui o estado da missão nos saves. Código e testes em `src/lab/mission.mjs` e `tests/mission.test.mjs`.

**Base da v0.3.4:** duas patrulhas inimigas móveis usam navegação A* para perseguir aliados, participar de combates e recarregar munição. Esquadrões aliados podem seguir o jogador nas formações **cunha, linha ou coluna**, configuradas no laboratório e preservadas no JSON. Alvos hostis possuem marcação visual vermelha e o HUD mostra o total dinâmico de inimigos. `src/lab/formation.mjs` contém a lógica testável das formações.

**Novidades v0.3.3:** combate entre unidades: bots aliados e alvos hostis reagem com disparos, seleção automática de alvos e alvos prioritários. Painel de esquadrão com seleção múltipla, ordens Atacar/Defender/Seguir/Cessar fogo, contagem de mortes e pontuação individual, log de eventos e estado salvo no JSON. Regras isoladas em `src/lab/combat.mjs` e testes `tests/combat.test.mjs`.

**Base da v0.3.2:** bots de solo com busca A* e desvio de prédios/tanques; painel móvel de tripulação, atribuição de soldados a postos sem duplicação e persistência JSON dos ocupantes. Testes em `tests/navigation.test.mjs`, `tests/crew.test.mjs`, `tests/movement.test.mjs` executados no GitHub Actions.

**Base da v0.3.1:** segundo soldado com identidade e estado individuais, prevenção básica de atravessar construções/tanques, desembarque com busca de saída livre, módulo `src/lab/movement.mjs` e testes unitários em `tests/movement.test.mjs`. O jogo principal continua v0.2.0.

## 🧰 Editor 3D experimental

Abra [WMK World Studio Beta](studio.html) no servidor HTTP. Crie objetos primitivos, transforme com gizmos G/R/S, duplique, salve/import/export mapas JSON, mova e redimensione os painéis. Editor de JSON para veículos, bots, missões e armas com exemplos, **sem ligação automática ao jogo**. Para inserir no chão, segure Shift e clique no terreno.

## 📦 ZIP completo de testes

O GitHub Actions gera automaticamente **WMK-Combined-Arms-v0.3.6.zip** após executar as verificações. Acesse [Actions](https://github.com/WalneyNF/WMK-Combined-Arms/actions), abra a execução mais recente concluída e baixe o artefato `WMK-Combined-Arms-v0.3.6-ZIP`. Alternativamente, o [ZIP direto do branch main](https://github.com/WalneyNF/WMK-Combined-Arms/archive/refs/heads/main.zip) contém o projeto integral atualizado.

## ▶️ Jogar

Use um servidor HTTP: `py -m http.server 4173` e acesse `http://localhost:4173/`. O jogo depende de internet para carregar Three.js pelo CDN.

**Controle de unidades:** 1 helicóptero, 2 tanque, 3 navio, 4 soldado, 5 artilharia, 6 avião, 7 submarino, 8 APC. Ao trocar, as unidades continuam na cena e preservam posição, vida e recargas. Soldado tem câmera próxima em terceira pessoa. JSON individual em `data/units/`; atributos são carregados em servidor HTTP com valores de contingência embutidos. O comportamento é arcade/protótipo.

**Controles:** WASD (movimento), Espaço (atirar), F (míssil), Q/E (altitude do helicóptero), Shift (impulso), Esc (pausa), 1/2/3 (trocar veículo). O (opções gráficas).

## 📚 Documentação HTML

- [Roadmap completo](roadmap.html)
- [Primeiro contato](manuais/primeiro-contato.html)
- [Instalação](manuais/instalacao.html)
- [Controles](manuais/controles.html)
- [Arquitetura](manuais/arquitetura.html)
- [Projeto do editor de mapas](manuais/editor-mapas.html)
- [Projeto do editor de missões](manuais/editor-missoes.html)
- [Veículos e IA](manuais/veiculos-e-ia.html)
- [Controle dinâmico de unidades — arquitetura](manuais/sistema-unidades.html)

## ✅ Recursos disponíveis

- Jogo único em `index.html`, importando Three.js 0.161.0.
- Ilha, oceano, árvores, base, porto, pista e inimigos.
- Oito classes de unidades no mesmo cenário: helicóptero, tanque, navio, soldado, artilharia, avião, submarino e APC (modelos procedurais).
- Troca de controle mantendo estado individual; tiros, mísseis, radar e HUD adaptados.
- Quando a unidade ativa é destruída, o controle passa para uma sobrevivente.
- Objetivo demonstrativo de 8 eliminações.
- Configuração gráfica persistente (botão e tecla O).
- Estúdio beta 3D em página separada (edição de mapas e dados ainda não executados pelo jogo).

## 🔧 Em planejamento

Editores de mapas, missões, bots, armas, objetos; IA de unidades não controladas, modelos GLB; importação GLB; campanha e progressão. **Os arquivos de exemplo em `data/exemplos/` documentam contratos futuros, não são carregados pelo jogo atual.**

## ⚖️ Licença

MIT; consulte [LICENSE](LICENSE). Código original fornecido pelo responsável pelo repositório; colaboradores devem verificar a licença de códigos e assets de terceiros antes de incorporar material.

## 🛠️ Contribuições

Abra issue com passos de reprodução, ambiente, screenshot e logs do Console F12. Faça alterações pequenas e teste os três veículos antes de pull request.
