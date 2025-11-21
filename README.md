# NEURA OS 🧠

Sistema Neural de Produtividade pensado para o contexto de **jovem acadêmico que também trabalha como freelancer**.  
O foco é organizar **energia, tarefas, estudos, finanças e saúde mental** em um único painel minimalista.

---

## 🌐 Demo

> 🔗 **GitHub Pages:** https://vinicostasc01.github.io/neura-os/

Abra esse link para visualizar a versão atual do front-end do NEURA OS.

---

## 🎯 Visão Geral

O NEURA OS foi desenhado como um “**sistema operacional mental**”, onde cada aba representa um pilar da rotina:

- **Dashboard** – visão geral de energia, tarefas e humor;
- **Produtividade** – EnergyEngine + Focus Mode;
- **Estudos** – integração futura com Google Classroom;
- **Financeiro** – organização básica de entradas/saídas e metas;
- **Tarefas** – sistema de peso de tarefas + mapa neural;
- **Psicólogo** – chat guiado por IA com linha emocional e insights.

O objetivo é ir, no futuro, integrar tudo com:

- **API do Google Fit**
- **Mi Band**
- **Agente de IA (ChatGPT)**

para interpretar dados biológicos, padrão de foco, procrastinação e rotina.

---

## 🧩 Tecnologias Utilizadas

- **HTML5** – estrutura da aplicação;
- **CSS3** – layout, responsividade e tema;
- **JavaScript (vanilla)** – lógica de estado, interações e simulações;
- **GitHub Pages** – hospedagem estática do front-end.

Não há backend real ainda – todas as integrações (Google Fit, Classroom, IA) estão **mockadas** no front com placeholders e textos explicativos.

---

## 🎨 Design & Temas

Paleta **minimalista**:

- Preto: `#171717`
- Branco: `#FFFFFF`
- Azul neon: `#27DAFA`

### Tipografia

- **Acumin Variable** – fonte principal do sistema;
- **Michroma** – usada no letreiro “NEURA OS” no canto superior direito.

### Temas

O sistema possui dois temas:

- **Dark Mode (Tech)**  
  - Bordas mais fortes, brilho neon, aparência de painel futurista.

- **Light Mode (Acadêmico/Clean)**  
  - Layout mais flat, menos sombra, foco em leitura e clareza.

O tema é alternado por um botão na topbar e salvo em `localStorage`.

---

## 🔧 Funcionalidades (Front-end)

### 🧠 Dashboard

- Card de **Energia Corporal** (EnergyEngine);
- Mini-mapa de tarefas do dia;
- Linha emocional ASCII dos últimos 7 dias;
- Atalho para a aba de Tarefas e Psicólogo.

---

### ⚡ Produtividade & EnergyEngine

- Formulário para registrar:
  - Horas de sono;
  - Nível de treino;
  - Foco mental;
  - Qualidade da alimentação;
- Cálculo de energia (0–100) com texto orientando o tipo de atividade ideal;
- **Focus Mode**:
  - Define tarefa + duração;
  - Timer simples;
  - Registro das sessões e impacto na energia;
  - Atualização da linha emocional com base nas sessões concluídas.

#### Integração Google Fit (simulação)

Na interface há:

- Indicador de status da **API do Google Fit / Mi Band**;
- Botão para **“Simular leitura da API Google Fit”**;
- Pílulas de conexão (Desconectado / Conectado – simulado).

> No futuro, o backend deve autenticar via OAuth, ler BPM, sono, passos, estresse etc. e alimentar o EnergyEngine e o Psicólogo.

---

### 📚 Estudos

- Texto explicativo da futura integração com **Google Classroom**:
  - Importar atividades, provas e trabalhos;
  - Cruzar prazos com a energia disponível;
  - Gerar plano de estudo inteligente.

- Fila de estudo:
  - Cadastro de blocos (tópico + duração);
  - Pensado para ser usado junto com o Focus Mode.

---

### 💰 Financeiro

- Lançamento de **entradas** (freelas/salário) e **saídas** (contas/gastos);
- Resumo:
  - Total de entradas;
  - Total de saídas;
  - Saldo;
- Meta financeira:
  - Define um valor (ex: notebook, investimento);
  - Define um prazo;
  - Sistema calcula quanto precisa ser gerado por mês.

---

### ✅ Tarefas

- Cadastro de tarefa com:
  - Título;
  - Urgência (0–10);
  - Esforço (0–10);
  - Impacto (0–10);
  - Data, hora;
  - Categoria (pessoal, acadêmico, profissional, financeiro).

- Cálculo de **Peso da tarefa**:
  ```text
  peso = (urgência + esforço + impacto) / 3
