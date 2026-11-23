# WMK Combined Arms 🎮

**Protótipo de combate militar 3D no navegador, em português.** Helicóptero, tanque e navio, ilha procedural, combate contra inimigos, mira, radar, mísseis e missões.

**Versão:** 0.2.0 · **Autor das adaptações WMK:** Walney Moreira Klein — walneyk@hotmail.com

## 🧰 Editor 3D experimental

Abra [WMK World Studio Beta](studio.html) no servidor HTTP. Crie objetos primitivos, transforme com gizmos G/R/S, duplique, salve/import/export mapas JSON, mova e redimensione os painéis. Editor de JSON para veículos, bots, missões e armas com exemplos, **sem ligação automática ao jogo**. Para inserir no chão, segure Shift e clique no terreno.

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
