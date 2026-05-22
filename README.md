# 🃏 Jogo da Memória

Jogo da memória multijogador com modos offline, contra IA e online em tempo real. Desenvolvido em HTML, CSS e JavaScript puro — tudo em um único arquivo.

🔗 **[Jogar agora](https://mervati.github.io/Jogo-da-Memoria)**

---

## Funcionalidades

### Modos de jogo
- **Multijogador local** — até 4 jogadores no mesmo dispositivo
- **Contra a IA** — 3 níveis de dificuldade: Fácil, Médio e Difícil
- **Online** — partidas em tempo real entre dois jogadores via código de sala

### Visual e experiência
- Tela inicial com efeito **parallax em 3 camadas** (orbs, emojis flutuantes, partículas) reagindo ao movimento do mouse e ao giroscópio no celular
- Card glassmorphism na tela inicial com fundo desfocado
- **3 temas visuais**: Padrão (azul), Preto e Vermelho — troca em tempo real
- **Modo daltônico** com paleta acessível (azul, laranja, ciano, magenta)
- Animação de fade-in no título do menu
- Tela de carregamento animada ao abrir o jogo

### Animações
- **Brilho nas cartas** ao acertar um par: pop de escala + faixa de luz varrendo a face + glow colorido
- **Efeito no placar** ao marcar ponto: número cresce, card do jogador pulsa, "+1" flutua e some
- **Confete** ao vencer e **chuva de cinzas** ao perder, com fanfares de áudio
- **Reações emoji** no modo online: emoji animado sobe em tela cheia com o nome de quem enviou

### Áudio
- Música de fundo gerada via Web Audio API (presente desde a tela inicial)
- Sons para virar carta, acertar par, vencer e perder
- Widget flutuante com controle de volume separado para música e sons
- Mute individual por canal ou geral com um clique
- Compatível com iOS (AudioContext suspenso)

### Placar e recordes
- Cronômetro visível durante partidas offline (mesmo valor salvo no récorde)
- **Top 5 recordes pessoais** salvos em `localStorage`, ordenados por tentativas e tempo
- Mensagens de fim de jogo contextuais com humor (ex: perdeu para a IA no fácil)
- Exibição do nível de dificuldade na tela de resultado

### Modo online
- Criação e entrada em sala por **código de 6 caracteres**
- Sincronização de tabuleiro, placar e turnos via Firebase em tempo real
- **Chat de reações** com 6 emojis: 🖕 😭 🔥 💩 🤣 🤬 (cooldown de 2,5s)
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
git add index.html
git commit -m "Descrição das mudanças"
git push
```

---

## Estrutura do projeto

```
Jogo da Memória/
└── index.html   # Todo o jogo: HTML + CSS + JS em um único arquivo
```

---

## Desenvolvido por

**Mariana Ervati**
