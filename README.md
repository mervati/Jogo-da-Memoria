# 🃏 Jogo da Memória

Jogo da memória multijogador com modos offline, contra IA e online em tempo real. Desenvolvido em HTML, CSS e JavaScript puro — tudo em um único arquivo.

🔗 **[Jogar agora](https://mervati.github.io/Jogo-da-Memoria)**

---

## Funcionalidades

### Modos de jogo
- **Multijogador local** — até 4 jogadores no mesmo dispositivo
- **Contra a IA** — 3 níveis de dificuldade: Fácil, Médio e Difícil
- **Online** — partidas em tempo real entre dois jogadores via código de sala

### Tela inicial
- Efeito **parallax em 3 camadas** reagindo ao mouse (desktop) e ao giroscópio (celular):
  - Orbs desfocados com as cores do tema pulsando ao fundo
  - Emojis flutuantes espalhados pelas bordas com rotação e timing únicos
  - Partículas pontilhadas com glow que sobem e descem suavemente
- **Card glassmorphism** centralizando o conteúdo com fundo desfocado e borda sutil
- Título com **degradê exclusivo por tema**, animado em loop
- Animação de fade-in no título ao carregar
- Tela de carregamento animada com emoji, título e pontos pulsantes

### Temas e acessibilidade
- **3 temas visuais** com widget flutuante 🎨, troca em tempo real e persistência:
  - **Padrão** — azul escuro com degradê vermelho → ciano
  - **Preto** — fundo preto com degradê branco → azul neon
  - **Vermelho** — fundo vermelho escuro com degradê vermelho → âmbar
- **Modo daltônico** integrado ao widget de temas — substitui as cores dos jogadores por paleta acessível (azul, laranja, ciano, magenta), funciona em tempo real

### Animações de jogo
- **Brilho nas cartas** ao acertar par: pop de escala + faixa de luz varrendo a face + glow persistente na cor do tema
- **Efeito no placar** ao marcar ponto: número cresce, card do jogador pulsa com glow, "+1" flutua e some
- **Confete colorido** ao vencer e **chuva de cinzas** ao perder — ambos com fanfares de áudio
- Mensagens de fim de jogo com humor contextual e exibição do nível de dificuldade

### Áudio
- Música de fundo gerada via Web Audio API (presente desde a tela inicial)
- Sons para virar carta, acertar par, vencer e perder
- Widget flutuante com controle de volume separado para música e sons
- Mute individual por canal ou geral com um clique
- Compatível com iOS (AudioContext suspenso)

### Placar e recordes
- Cronômetro visível durante partidas offline — mesmo valor salvo no récorde
- **Top 5 recordes pessoais** em `localStorage`, ordenados por tentativas e tempo como critério de desempate
- Tela dedicada de recordes acessível pelo menu

### Modo online
- Criação e entrada em sala por **código de 6 caracteres**
- Sincronização de tabuleiro, placar e turnos via Firebase em tempo real
- **Chat de reações** com 6 emojis: 🖕 😭 🔥 💩 🤣 🤬 — sincronizado via Firebase com animação flutuante e cooldown de 2,5s
- Temporizador de turno com alerta visual ao se esgotar
- Sistema de revanche integrado
- Detecção de desconexão com contagem regressiva

---

## Tecnologias

| Recurso | Tecnologia |
|---|---|
| Interface | HTML5 + CSS3 + JavaScript (ES6+) |
| Multiplayer online | Firebase Realtime Database (compat SDK v10.12.0) |
| Áudio | Web Audio API (osciladores, ganho, agendamento) |
| Animações | CSS Keyframes + Canvas API + requestAnimationFrame |
| Parallax | mousemove / deviceorientation + lerp com requestAnimationFrame |
| Persistência local | localStorage (tema, modo daltônico, recordes) |
| Hospedagem | GitHub Pages |

---

## Como jogar localmente

Não há dependências nem build. Basta abrir o arquivo:

```
index.html
```

Abra diretamente no navegador — funciona sem servidor.

---

## Deploy

O jogo é hospedado via GitHub Pages. Para publicar uma nova versão:

```bash
git add index.html README.md
git commit -m "Descrição das mudanças"
git push
```

---

## Estrutura do projeto

```
Jogo da Memória/
├── index.html   # Todo o jogo: HTML + CSS + JS em um único arquivo
└── README.md
```

---

## Desenvolvido por

**Mariana Ervati**
