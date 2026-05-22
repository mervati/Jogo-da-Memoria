# 🃏 Jogo da Memória

Jogo da memória multijogador com modos offline, contra IA e online em tempo real. Desenvolvido em HTML, CSS e JavaScript puro — tudo em um único arquivo.

🔗 **[Jogar agora](https://mervati.github.io/Jogo-da-Memoria)**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=flat&logo=githubpages&logoColor=white)
![Sem dependências](https://img.shields.io/badge/dependências-nenhuma-brightgreen?style=flat)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-✓-orange?style=flat)

---

## Funcionalidades

### Modos de jogo
- **Multijogador local** — até 4 jogadores no mesmo dispositivo
- **Contra a IA** — 3 níveis de dificuldade: Fácil, Médio e Difícil
- **Online** — partidas em tempo real entre dois jogadores via código de sala

### Navegação por abas
Cada módulo possui abas internas para acesso rápido a todas as seções:
- **Módulo offline** — abas: Jogar · Recordes · Stats
- **Módulo online** — abas: Jogar Online · Ranking Global · Stats

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
- **Efeito ripple** ao clicar em uma carta — onda circular se expande a partir do toque, nos modos offline e online
- **Brilho nas cartas** ao acertar par: pop de escala + faixa de luz varrendo a face + glow persistente na cor do tema
- **Efeito no placar** ao marcar ponto: número cresce, card do jogador pulsa com glow, "+1" flutua e some
- **Confete colorido** ao vencer e **chuva de cinzas** ao perder — ambos com fanfares de áudio
- Mensagens de fim de jogo com humor contextual e exibição do nível de dificuldade
- **Barra de turno** com textos naturais: "Sua vez de jogar" (jogador humano), "Vez da máquina" (IA), "Vez de [nome]" (multiplayer com nomes personalizados)

### Nome do jogador salvo
- Nome digitado é **salvo automaticamente** em `localStorage` ao sair do campo
- Pre-preenche os campos de nome nas telas offline e online a cada acesso
- Badge **💾 Nome salvo** exibido quando o nome é carregado automaticamente
- Nome sincronizado entre os dois módulos — digitar em um atualiza o outro
- Pode ser editado a qualquer momento; a alteração persiste para próximas sessões

### Estatísticas detalhadas
Histórico completo de desempenho por módulo, acessível na aba Stats de cada tela:
- **Offline** — total de partidas, vitórias, taxa de vitória, média de tentativas e tempo médio, separados por tamanho de tabuleiro (4×4, 4×5, 6×6)
- **Online** — mesmas métricas para partidas remotas, independentes das offline
- Dados persistidos em `localStorage` e exibidos em cards por tamanho com indicadores de destaque

### Áudio
- Música de fundo gerada via Web Audio API (presente desde a tela inicial)
- Sons para virar carta, acertar par, vencer e perder
- Widget flutuante com controle de volume separado para música e sons
- Mute individual por canal ou geral com um clique
- Compatível com iOS (AudioContext suspenso)

### Placar e recordes
- Cronômetro visível durante partidas offline — mesmo valor salvo no récorde
- **Top 5 recordes pessoais** em `localStorage`, ordenados por tentativas e tempo como critério de desempate
- Acessíveis diretamente pela aba Recordes dentro do módulo offline

### Modo online
- Criação e entrada em sala por **código de 6 caracteres**
- **Botão copiar** o código da sala — um clique copia para a área de transferência e confirma com "✅ Copiado!" por 2 segundos
- Status e código da sala **limpos automaticamente** ao navegar de volta para a tela online, evitando exibição de estado desatualizado
- Sincronização de tabuleiro, placar e turnos via Firebase em tempo real
- **Chat de reações** com 6 emojis: 🖕 😭 🔥 💩 🤣 🤬 — sincronizado via Firebase com animação flutuante e cooldown de 2,5s
- Temporizador de turno com alerta visual ao se esgotar
- Sistema de revanche integrado
- **Detecção de desistência** — ao sair do fim de jogo, o oponente vê a mensagem "[nome] não quer mais jogar. Voltando ao menu em 5s..." com contagem regressiva simétrica para ambos os jogadores
- **Ranking Global** — placar online via Firebase com os 10 melhores por tamanho de tabuleiro, separado dos recordes offline; ordenado por tentativas e tempo

---

## Tecnologias

| Recurso | Tecnologia |
|---|---|
| Interface | HTML5 + CSS3 + JavaScript (ES6+) |
| Multiplayer online | Firebase Realtime Database (compat SDK v10.12.0) |
| Áudio | Web Audio API (osciladores, ganho, agendamento) |
| Animações | CSS Keyframes + Canvas API + requestAnimationFrame |
| Parallax | mousemove / deviceorientation + lerp com requestAnimationFrame |
| Persistência local | localStorage (tema, modo daltônico, recordes, estatísticas, nome do jogador) |
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
git add index.html css/style.css js/app.js README.md
git commit -m "Descrição das mudanças"
git push
```

---

## Estrutura do projeto

```
Jogo da Memória/
├── index.html       # Estrutura HTML das telas
├── README.md
├── css/
│   └── style.css    # Todos os estilos, temas e animações CSS
└── js/
    └── app.js       # Toda a lógica do jogo (áudio, Firebase, IA, recordes)
```

---

## Desenvolvido por

**Mariana Ervati**
