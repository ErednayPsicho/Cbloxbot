# 📢 Sistema de Mensagens da Staff

## Visão Geral

O sistema de mensagens da staff é um painel customizável para comunicações internas da equipe. Similar aos sistemas de intermediação (Middleman) e suporte (Help Tickets), mas dedicado exclusivamente à staff do servidor.

## ✨ Funcionalidades

- ✅ **Criar mensagens customizadas** - Com títulos, descrições e cores próprias
- ✅ **Tipos de mensagens** - Avisos, Reuniões, Relatórios, Alertas, Anúncios e Configurações
- ✅ **Tabelas formatadas** - Estilo HTML-like usando code blocks
- ✅ **Gerenciar mensagens** - Editar e deletar mensagens criadas
- ✅ **Sem banco de dados** - Sistema completamente funcional via armazenamento em memória

## 🚀 Configuração

### Criando um Painel de Staff

Apenas **administradores** podem criar painéis de mensagens da staff.

```
/setup-staff
```

Isso irá:
1. Criar um painel permanente no canal atual
2. Adicionar um botão "📢 Criar Mensagem de Staff"
3. Permitir que qualquer pessoa veja o painel (mas apenas admins criem mensagens)

## 📋 Tipos de Mensagens

### 1. 📋 Avisos
Comunicados importantes para a staff

**Uso:**
- Alterações de regras
- Notificações de manutenção
- Avisos de procedimentos

### 2. 👥 Reuniões
Agendamento e informações de reuniões

**Uso:**
- Agendar reuniões de staff
- Informações de reunião
- Notas de reunião

### 3. 📊 Relatórios
Compartilhar relatórios e estatísticas

**Uso:**
- Relatórios de atividade
- Estatísticas do servidor
- Dados de moderation

### 4. ⚠️ Alertas
Avisos críticos e urgentes

**Uso:**
- Alertas de segurança
- Situações urgentes
- Issues críticas

### 5. ✨ Anúncios
Anúncios gerais da staff

**Uso:**
- Anúncios especiais
- Novos eventos
- Novas features

### 6. 🔧 Configurações
Mensagens de configuração do servidor

**Uso:**
- Mudanças de configuração
- Setup de novos sistemas
- Guias de ferramentas

## 🎨 Cores Padrão

O sistema usa cores padronizadas baseadas no tipo de mensagem:

| Tipo | Cor | Hex |
|------|-----|-----|
| Padrão | Orange | #E8511A |
| Sucesso | Verde | #2ECC71 |
| Aviso | Amarelo | #F39C12 |
| Erro | Vermelho | #E74C3C |
| Info | Azul | #3498DB |

## 🔧 Como Usar

### Criar uma Mensagem de Staff

1. Clique no botão **"📢 Criar Mensagem de Staff"** no painel
2. Selecione o tipo de mensagem desejado
3. Preencha o **Título** e **Descrição**
4. A mensagem será criada com:
   - ✏️ Botão "Editar" - Para modificar a mensagem
   - 🗑️ Botão "Deletar" - Para remover a mensagem
   - 👁️ Botão "Ver Detalhes" - Para ver informações completas

### Editar uma Mensagem

1. Clique no botão **"✏️ Editar"** na mensagem que deseja modificar
2. Atualize o **Título** e/ou **Descrição**
3. A mensagem será atualizada automaticamente com:
   - Timestamp de atualização
   - Nome de quem editou

### Deletar uma Mensagem

1. Clique no botão **"🗑️ Deletar"** na mensagem que deseja remover
2. Confirme a deleção
3. A mensagem será removida do painel

### Ver Detalhes

1. Clique no botão **"👁️ Ver Detalhes"** para ver:
   - ID único da mensagem
   - Quem criou
   - Quem editou (se aplicável)
   - Datas de criação e edição

## 📁 Estrutura de Arquivos

```
src/
├── commands/
│   └── setup-staff.js            # Comando para criar painel
├── handlers/
│   └── staffMessagesHandler.js   # Handler de interações
└── events/
    └── interactionCreate.js      # Evento de interações (modificado)
```

## 🛡️ Permissões

| Ação | Administrador | Staff | Usuários |
|------|---------------|-------|----------|
| Criar Painel | ✅ | ❌ | ❌ |
| Criar Mensagem | ✅ | ❌ | ❌ |
| Editar Mensagem Própria | ✅ | ❌ | ❌ |
| Editar Mensagem Alheia | ✅ | ❌ | ❌ |
| Deletar Mensagem Própria | ✅ | ❌ | ❌ |
| Deletar Mensagem Alheia | ✅ | ❌ | ❌ |
| Ver Mensagens | ✅ | ✅ | ✅ |

## 💾 Armazenamento

As mensagens da staff são armazenadas em **memória**. Isso significa:

- ✅ **Rápido e eficiente** - Sem latência de banco de dados
- ✅ **Simples** - Sem necessidade de configuração de BD
- ⚠️ **Não persistente** - As mensagens são perdidas ao reiniciar o bot

Para uso em produção com persistência, considere:
- Integrar com PostgreSQL
- Salvar em arquivo JSON
- Usar cache distribuído (Redis)

## 📝 Exemplo de Uso

### Criar Aviso para Manutenção

```
/setup-staff [em um canal de staff]
```

1. Clique em "📢 Criar Mensagem de Staff"
2. Selecione "📋 Avisos"
3. Preencha:
   - **Título:** Manutenção do Servidor - 22/05
   - **Descrição:** O servidor entrará em manutenção de 23:00 a 23:30 UTC. Todos os usuários serão kickados automaticamente. Pedimos desculpas pelo incômodo.
4. A mensagem será criada com timestamp e informações do criador

### Atualizar Avisos

Para editar a mensagem:
1. Clique em "✏️ Editar"
2. Modifique a descrição se necessário
3. A mensagem será atualizada com novo timestamp

## 🆘 Troubleshooting

### "Este comando só pode ser usado por administradores"
- Você não tem permissão de administrador
- Peça a um administrador para executar o comando

### Mensagem não aparece após criar
- Verifique se você está no canal correto
- Atualize a página/Discord
- Tente novamente

### Não consigo editar/deletar minha mensagem
- Você não é o criador da mensagem
- Peça a um administrador para fazer a alteração
- Ou crie uma nova mensagem

## 📚 Integração com Outros Sistemas

O sistema de mensagens da staff é complementar a:
- **Middleman System** - Para trades e intermediações
- **Support Tickets** - Para suporte geral
- **Logging System** - Para auditoria de ações

## 🔄 Comparação com Sistemas Similares

| Recurso | Staff | Middleman | Support |
|---------|-------|-----------|---------|
| Criar Mensagens | ✅ | ✅ | ✅ |
| Tabelas Formatadas | ✅ | ✅ | ✅ |
| Editar Mensagens | ✅ | ❌ | ❌ |
| Deletar Mensagens | ✅ | ❌ | ❌ |
| Apenas Admins | ✅ | ❌ | ❌ |
| Sem BD | ✅ | ✅ | ✅ |

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se você tem permissão de administrador
2. Confira as permissões do canal
3. Releia este documento
4. Abra um issue no repositório

---

**Versão:** 1.0  
**Última Atualização:** Maio 2026  
**Sistema:** HowlBot
