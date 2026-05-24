# 🃏 Jogo da Memória

Jogo da memória multijogador com modos offline, contra IA e online em tempo real. Desenvolvido em HTML, CSS e JavaScript puro — tudo em um único arquivo.

🔗 **[Jogar agora](https://mervati.github.io/Jogo-da-Memoria)** · **v1.4.0**

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
- **Online** — partidas em tempo real entre 2 a 4 jogadores via código de sala

### Navegação por abas
Cada módulo possui abas internas para acesso rápido a todas as seções:
- **Módulo offline** — abas: Jogar · Recordes · Stats
- **Módulo online** — abas: Jogar Online · Ranking Global · Stats

### Tela inicial
- Efeito **parallax em 3 camadas** reagindo ao mouse (desktop) e ao giroscópio (celular):
  - Orbs desfocados com as cores do tema pulsando ao fundo
  - Emojis flutuantes espalhados pelas bordas com rotação e timing únicos (padrão) ou escudos e emojis temáticos no tema Flamengo
  - Partículas pontilhadas com glow que sobem e descem suavemente
- **Card glassmorphism** centralizando o conteúdo com fundo desfocado e borda sutil
- Título com **degradê exclusivo por tema**, animado em loop
- Animação de fade-in no título ao carregar
- Tela de carregamento animada com emoji, título e pontos pulsantes

### Temas e acessibilidade
- **3 temas visuais** com widget flutuante 🎨, troca em tempo real e persistência:
  - **Padrão** — azul escuro com degradê vermelho → ciano
  - **Dark** — fundo preto com degradê branco → azul neon
  - **Flamengo** — tema completo rubro-negro: fundo escuro com accent vermelho (#E30613) e dourado (#FFD700), escudos flutuantes animados na tela inicial, verso das cartas com logo em marca d'água, emojis temáticos (🦅 ⚽ 🏆), confete nas cores do clube, hino remix como som de vitória, textos renomeados (dificuldades viram Amador / Banco de reserva / Camisa 10, modo IA vira "Jogador × Treinador")
- **Modo daltônico** integrado ao widget de temas — substitui as cores dos jogadores por paleta acessível (azul, laranja, ciano, magenta), funciona em tempo real

### Ajuda contextual
- Botão **❓** fixo em todas as telas abre um overlay com explicações específicas da seção ativa
- Conteúdo diferente para cada aba: setup offline, setup online, recordes, ranking global, estatísticas, tela de jogo (offline e online) e fim de partida
- Fechável clicando no ✕ ou fora do painel

### Layout do tabuleiro
- Botão **↔ / ↕** fixo no canto inferior direito, visível apenas durante a partida
- Alterna entre **layout vertical** (tabuleiro centralizado, painel de informações acima) e **layout horizontal** (sidebar lateral com placar, barra de turno e timer + tabuleiro ao lado)
- Preferência salva em `localStorage` e restaurada a cada sessão

### Animações de jogo
- **Animação de entrada das cartas**: ao iniciar uma partida cada carta faz pop em cascata (escala 0.25 → 1 com bounce elástico), com delay escalonado por linha + coluna e som de distribuição (whoosh de ruído + shimmer ascendente de 4 notas)
- **Efeito ripple** ao clicar em uma carta — onda circular se expande a partir do toque, nos modos offline e online
- **Brilho nas cartas** ao acertar par: pop de escala + faixa de luz varrendo a face + glow persistente na cor do tema
- **Efeito no placar** ao marcar ponto: número cresce, card do jogador pulsa com glow, "+1" flutua e some
- **Confete colorido** ao vencer (cores do tema ativo, incluindo Flamengo) e **chuva de cinzas** ao perder — ambos com fanfares de áudio
- Mensagens de fim de jogo com humor contextual e exibição do nível de dificuldade
- **Barra de turno** com textos naturais: "Sua vez de jogar" (jogador humano com nome padrão), "Vez da máquina" (IA), "Vez de [nome]" (multiplayer com nomes personalizados)

### Confirmação de saída
- Ao clicar em "Menu" durante uma partida, exibe **modal de confirmação** estilizado no lugar do `confirm()` nativo
- Opções "Não, continuar" e "Sim, sair"; fechável clicando fora do painel

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
- Botão **← Voltar** ao final de cada tela de estatísticas

### Áudio
- Música de fundo gerada via Web Audio API (presente desde a tela inicial)
- Sons para: distribuição das cartas (whoosh + shimmer), virar carta, acertar par, empate (aplausos), vencer e perder
- No tema Flamengo a vitória toca o hino remix no lugar do fanfare padrão
- Widget flutuante com controle de volume separado para música e sons
- Mute individual por canal ou geral com um clique
- Compatível com iOS (AudioContext suspenso)

### Placar e recordes
- Cronômetro visível durante partidas offline — mesmo valor salvo no récorde
- **Top 5 recordes pessoais** em `localStorage`, ordenados por tentativas e tempo como critério de desempate
- Acessíveis diretamente pela aba Recordes dentro do módulo offline

### Modo online
- **2 a 4 jogadores** na mesma partida — o criador escolhe o número de participantes antes de abrir a sala
- Criação e entrada em sala por **código de 6 caracteres**
- **Sala de espera dinâmica**: lista de jogadores atualizada em tempo real conforme entram; o criador vê o botão "▶ Iniciar Partida" assim que 2 ou mais participantes estiverem presentes
- **Botão copiar** o código da sala — um clique copia para a área de transferência e confirma com "✅ Copiado!" por 2 segundos
- **Validações de entrada**: sala não encontrada, partida já em andamento e sala cheia são tratadas com mensagem imediata e sem travar a tela
- Status e código da sala **limpos automaticamente** ao navegar de volta para a tela online
- Sincronização de tabuleiro, placar e turnos via Firebase em tempo real
- **Chat de reações** com 6 emojis: 🖕 😭 🔥 💩 🤣 🤬 — sincronizado via Firebase com animação flutuante e cooldown de 2,5s
- Temporizador de turno de 2 minutos com alerta visual; ao se esgotar a vez passa automaticamente para o próximo jogador ativo
- **Tratamento de desconexão**: jogador que sai é removido da partida automaticamente; os demais continuam jogando normalmente; se restar apenas 1 jogador, um contador de 10 segundos é exibido antes de mostrar o resultado
- **Vencedor por sobrevivência**: o último jogador restante vence independentemente do placar; em partidas completas, vence quem tiver mais pares
- Sistema de revanche integrado (disponível apenas em partidas 2×2 sem desconexões)
- **Detecção de desistência** — ao sair do fim de jogo, o oponente vê "[nome] não quer mais jogar. Voltando ao menu em 5s..." com contagem regressiva
- **Ranking Global** — placar online via Firebase com os 10 melhores por tamanho de tabuleiro, separado dos recordes offline; ordenado por tentativas e tempo

---

## Tecnologias

| Recurso | Tecnologia |
|---|---|
| Interface | HTML5 + CSS3 + JavaScript (ES6+) |
| Multiplayer online | Firebase Realtime Database (compat SDK v10.12.0) |
| Áudio | Web Audio API (osciladores, ganho, agendamento) + `new Audio()` |
| Animações | CSS Keyframes + Canvas API + requestAnimationFrame |
| Parallax | mousemove / deviceorientation + lerp com requestAnimationFrame |
| Persistência local | localStorage (tema, layout, modo daltônico, recordes, estatísticas, nome) |
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
