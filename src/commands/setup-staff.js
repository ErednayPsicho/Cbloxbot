/**
 * /setup-staff Command
 * 
 * Creates a customizable message panel for staff communications in the server.
 * Allows administrators to set up beautiful, formatted messages similar to 
 * the middleman and support ticket systems.
 * Restricted to Administrators only.
 */

import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  SelectMenuOptionBuilder
} from 'discord.js';
import versionConfig from '../config/version.js';
import { logger } from '../utils/logger.js';
import { InteractionHelper } from '../utils/interactionHelper.js';

// Custom IDs for the setup staff messages
export const STAFF_SETUP_IDS = {
  START_BUTTON: 'staff_start_setup',
  MENU_SELECT: 'staff_message_type_select',
  CREATE_MESSAGE_BUTTON: 'staff_create_message',
  EDIT_MESSAGE_BUTTON: 'staff_edit_message',
  DELETE_MESSAGE_BUTTON: 'staff_delete_message',
  COLOR_MODAL: 'staff_color_modal',
  TITLE_MODAL: 'staff_title_modal',
  DESCRIPTION_MODAL: 'staff_description_modal'
};

// Default theme for staff messages
const STAFF_THEME = {
  primary: 0xE8511A,      // Orange
  success: 0x2ECC71,      // Green
  warning: 0xF39C12,      // Yellow
  error: 0xE74C3C,        // Red
  info: 0x3498DB,         // Blue
  footerText: 'HowlBot Staff Messages | Sistema de Mensagens da Staff'
};

/**
 * Create the setup message embed
 */
function createSetupEmbed() {
  return new EmbedBuilder()
    .setColor(STAFF_THEME.primary)
    .setTitle('📢 Painel de Mensagens da Staff')
    .setThumbnail('https://images-ext-1.discordapp.net/external/8h1dXavug_ACztUMxYRo-aZMCdIL6o1GkUcN-S9ybWA/https/media.tenor.com/IpTNBgceTUAAAAPo/howl.mp4')
    .setDescription(
      '> Gerencie mensagens customizadas para comunicações internas da staff. ' +
      '> Similar ao sistema de intermediação e suporte, mas dedicado à equipe.'
    )
    .addFields(
      {
        name: '💡 FUNCIONALIDADES',
        value: '✅ Criar mensagens customizadas com cores e titles próprios\n' +
               '✅ Tabelas formatadas estilo HTML com dados da staff\n' +
               '✅ Sistema similar ao Middleman e Suporte\n' +
               '✅ Gerenciar múltiplas mensagens no mesmo painel\n\n',
        inline: false
      },
      {
        name: '🎨 TIPOS DE MENSAGENS',
        value: '📋 **Avisos** - Comunicados importantes\n' +
               '👥 **Reuniões** - Agendamento de reuniões\n' +
               '📊 **Relatórios** - Relatórios e estatísticas\n' +
               '⚠️ **Alertas** - Avisos críticos\n' +
               '✨ **Anúncios** - Anúncios gerais\n\n',
        inline: false
      },
      {
        name: '🔧 COMO USAR',
        value: '1. Clique em "Criar Mensagem de Staff"\n' +
               '2. Escolha o tipo de mensagem\n' +
               '3. Customize cores, título e descrição\n' +
               '4. A mensagem será criada no painel\n' +
               '5. Edite ou delete conforme necessário\n\n',
        inline: false
      },
      {
        name: '📋 REGRAS',
        value: '🔒 Apenas administradores podem criar mensagens\n' +
               '📝 Use descrições claras e objetivas\n' +
               '⏳ Mensagens são permanentes até serem deletadas\n' +
               '🎨 Escolha cores que combinem com o tema do servidor\n\n',
        inline: false
      }
    )
    .setFooter({ text: STAFF_THEME.footerText })
    .setTimestamp();
}

/**
 * Create the main action button
 */
function createStartButton() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(STAFF_SETUP_IDS.START_BUTTON)
        .setLabel('📢 Criar Mensagem de Staff')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝')
    );
}

/**
 * Create message type selection menu
 */
function createMessageTypeMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(STAFF_SETUP_IDS.MENU_SELECT)
        .setPlaceholder('Selecione o tipo de mensagem...')
        .addOptions([
          new SelectMenuOptionBuilder()
            .setLabel('📋 Avisos')
            .setDescription('Comunicados importantes para a staff')
            .setValue('aviso')
            .setEmoji('📋'),
          new SelectMenuOptionBuilder()
            .setLabel('👥 Reuniões')
            .setDescription('Agendamento e informações de reuniões')
            .setValue('reuniao')
            .setEmoji('👥'),
          new SelectMenuOptionBuilder()
            .setLabel('📊 Relatórios')
            .setDescription('Compartilhar relatórios e estatísticas')
            .setValue('relatorio')
            .setEmoji('📊'),
          new SelectMenuOptionBuilder()
            .setLabel('⚠️ Alertas')
            .setDescription('Avisos críticos e urgentes')
            .setValue('alerta')
            .setEmoji('⚠️'),
          new SelectMenuOptionBuilder()
            .setLabel('✨ Anúncios')
            .setDescription('Anúncios gerais da staff')
            .setValue('anuncio')
            .setEmoji('✨'),
          new SelectMenuOptionBuilder()
            .setLabel('🔧 Configurações')
            .setDescription('Mensagens de configuração do servidor')
            .setValue('configuracao')
            .setEmoji('🔧')
        ])
    );
}

/**
 * Create the customization modal for title
 */
function createTitleModal() {
  return new ModalBuilder()
    .setCustomId(STAFF_SETUP_IDS.TITLE_MODAL)
    .setTitle('Definir Título da Mensagem')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('staff_title_input')
          .setLabel('Título')
          .setPlaceholder('Digite o título da mensagem...')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('staff_description_input')
          .setLabel('Descrição/Conteúdo')
          .setPlaceholder('Digite a descrição ou conteúdo da mensagem...')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1024)
          .setRequired(true)
      )
    );
}

/**
 * Create a formatted staff message embed
 */
function createStaffMessageEmbed(title, description, type, color = STAFF_THEME.primary) {
  const typeEmojis = {
    aviso: '📋',
    reuniao: '👥',
    relatorio: '📊',
    alerta: '⚠️',
    anuncio: '✨',
    configuracao: '🔧'
  };

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${typeEmojis[type] || '📢'} ${title}`)
    .setDescription(description)
    .setFooter({ text: STAFF_THEME.footerText })
    .setTimestamp();
}

/**
 * Create action buttons for message management
 */
function createMessageActionButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(STAFF_SETUP_IDS.EDIT_MESSAGE_BUTTON)
        .setLabel('Editar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✏️'),
      new ButtonBuilder()
        .setCustomId(STAFF_SETUP_IDS.DELETE_MESSAGE_BUTTON)
        .setLabel('Deletar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );
}

/**
 * Create a formatted table-style message
 */
function createStaffMessageTable(data) {
  let table = '```\n';
  table += '┌────────────────────────────────────────┐\n';
  table += '│         MENSAGEM DA STAFF              │\n';
  table += '├────────────────────────────────────────┤\n';
  table += `│ Tipo: ${data.type.padEnd(31)}│\n`;
  table += `│ Criada: ${new Date().toLocaleDateString('pt-BR').padEnd(27)}│\n`;
  table += '├────────────────────────────────────────┤\n';
  table += `│ ${data.title.substring(0, 36).padEnd(36)}│\n`;
  table += '│                                        │\n';
  table += `│ ${data.description.substring(0, 36).padEnd(36)}│\n`;
  table += '└────────────────────────────────────────┘\n';
  table += '```';
  return table;
}

export default {
  data: new SlashCommandBuilder()
    .setName('setup-staff')
    .setDescription('📢 Configurar painel de mensagens da staff (Apenas Administradores)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  /**
   * Execute the /setup-staff command
   */
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Only administrators can use this command
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({
          content: '❌ Apenas administradores podem usar este comando.',
          ephemeral: true
        });
      }

      // Send the setup message
      await interaction.channel.send({
        embeds: [createSetupEmbed()],
        components: [createStartButton()]
      });

      await interaction.editReply({
        content: '✅ Painel de mensagens da staff criado com sucesso neste canal!'
      });

      logger.info(`[STAFF_SETUP] Painel criado`, {
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

    } catch (error) {
      logger.error('Error in setup-staff command:', error);
      
      const errorMessage = {
        content: '❌ Erro ao criar painel de mensagens da staff.',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};

// Export handler functions for button/modal interactions
export {
  createMessageTypeMenu,
  createTitleModal,
  createStaffMessageEmbed,
  createMessageActionButtons,
  createStaffMessageTable,
  STAFF_THEME
};
