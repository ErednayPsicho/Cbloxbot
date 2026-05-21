/**
 * Staff Messages Handler
 * 
 * Gerencia a criação, edição e deleção de mensagens customizadas da staff.
 * Similar ao mmHumanoHandler, mas focado em comunicações internas da equipe.
 */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} from 'discord.js';
import { logger } from '../utils/logger.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { STAFF_SETUP_IDS } from '../commands/setup-staff.js';
import {
  createMessageTypeMenu,
  createTitleModal,
  createStaffMessageEmbed,
  createMessageActionButtons,
  STAFF_THEME
} from '../commands/setup-staff.js';

// Store staff messages data (in production, use database)
const staffMessages = new Map();

/**
 * Generate a unique message ID
 */
function generateMessageId() {
  return `staff_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle the start button click (create message)
 */
export async function handleStaffMessageStart(interaction) {
  try {
    // Check if user is admin BEFORE deferring
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Apenas administradores podem criar mensagens de staff.',
        ephemeral: true
      });
    }

    await interaction.deferUpdate();

    // Show message type selection menu
    await interaction.followUp({
      content: '📢 **Selecione o tipo de mensagem que deseja criar:**',
      components: [createMessageTypeMenu()],
      ephemeral: true
    });

    logger.debug('[STAFF_HANDLER] Message creation started', {
      userId: interaction.user.id,
      guildId: interaction.guildId
    });

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleStaffMessageStart:', error);
    try {
      await interaction.reply({
        content: '❌ Erro ao iniciar criação de mensagem.',
        ephemeral: true
      });
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Handle message type selection
 */
export async function handleMessageTypeSelect(interaction) {
  try {
    const messageType = interaction.values[0];
    
    // Store the selected type in interaction context
    const context = {
      type: messageType,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      timestamp: Date.now()
    };

    // Show the title/description modal
    const modal = createTitleModal();
    
    // Store context temporarily (in production, use session storage)
    if (!interaction.client.staffContext) {
      interaction.client.staffContext = new Map();
    }
    interaction.client.staffContext.set(interaction.user.id, context);

    await interaction.showModal(modal);

    logger.debug('[STAFF_HANDLER] Message type selected', {
      userId: interaction.user.id,
      messageType: messageType
    });

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleMessageTypeSelect:', error);
    try {
      await interaction.reply({
        content: '❌ Erro ao selecionar tipo de mensagem.',
        ephemeral: true
      });
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Handle modal submission (create message)
 */
export async function handleStaffMessageModalSubmit(interaction) {
  let messageData = null;
  
  try {
    // Defer the update FIRST before any other response
    await interaction.deferUpdate();

    const title = interaction.fields.getTextInputValue('staff_title_input');
    const description = interaction.fields.getTextInputValue('staff_description_input');
    
    // Get context
    const context = interaction.client.staffContext?.get(interaction.user.id) || {};
    const messageType = context.type || 'anuncio';

    // Generate message ID
    const messageId = generateMessageId();

    // Create the message data
    messageData = {
      id: messageId,
      type: messageType,
      title: title,
      description: description,
      authorId: interaction.user.id,
      authorName: interaction.user.username,
      createdAt: new Date(),
      guildId: interaction.guildId
    };

    // Store the message
    if (!staffMessages.has(interaction.guildId)) {
      staffMessages.set(interaction.guildId, []);
    }
    staffMessages.get(interaction.guildId).push(messageData);

    // Get the type emoji
    const typeEmojis = {
      aviso: '📋',
      reuniao: '👥',
      relatorio: '📊',
      alerta: '⚠️',
      anuncio: '✨',
      configuracao: '🔧'
    };

    // Determine color based on type
    const colorMap = {
      aviso: STAFF_THEME.info,
      reuniao: STAFF_THEME.primary,
      relatorio: STAFF_THEME.success,
      alerta: STAFF_THEME.error,
      anuncio: STAFF_THEME.warning,
      configuracao: STAFF_THEME.info
    };

    // Create the embed
    const embed = createStaffMessageEmbed(
      title,
      description,
      messageType,
      colorMap[messageType] || STAFF_THEME.primary
    )
      .addFields({
        name: '👤 Criada por',
        value: `<@${interaction.user.id}>`,
        inline: true
      })
      .addFields({
        name: '📅 Data',
        value: new Date().toLocaleDateString('pt-BR'),
        inline: true
      })
      .addFields({
        name: '🏷️ ID da Mensagem',
        value: `\`${messageId}\``,
        inline: false
      });

    // Send the message with buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`staff_edit_${messageId}`)
          .setLabel('Editar')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✏️'),
        new ButtonBuilder()
          .setCustomId(`staff_delete_${messageId}`)
          .setLabel('Deletar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`staff_view_${messageId}`)
          .setLabel('Ver Detalhes')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👁️')
      );

    const message = await interaction.channel.send({
      embeds: [embed],
      components: [buttons]
    });

    // Store message ID for later reference
    messageData.discordMessageId = message.id;
    messageData.discordChannelId = interaction.channelId;

    // Clean up context
    if (interaction.client.staffContext) {
      interaction.client.staffContext.delete(interaction.user.id);
    }

    // Send success response via followUp
    await interaction.followUp({
      content: `✅ Mensagem de staff **"${title}"** criada com sucesso!`,
      ephemeral: true
    });

    logger.info('[STAFF_HANDLER] Staff message created', {
      messageId: messageId,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      type: messageType,
      title: title
    });

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleStaffMessageModalSubmit:', error);
    try {
      // Try to respond with error
      if (interaction.deferred) {
        await interaction.followUp({
          content: '❌ Erro ao criar mensagem de staff.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ Erro ao criar mensagem de staff.',
          ephemeral: true
        });
      }
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Handle edit button
 */
export async function handleStaffMessageEdit(interaction, messageId) {
  try {
    // Find the message BEFORE showing modal
    const guildMessages = staffMessages.get(interaction.guildId) || [];
    const messageData = guildMessages.find(m => m.id === messageId);

    if (!messageData) {
      return await interaction.reply({
        content: '❌ Mensagem não encontrada.',
        ephemeral: true
      });
    }

    // Check permission BEFORE showing modal
    if (messageData.authorId !== interaction.user.id && 
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Apenas o criador ou administradores podem editar esta mensagem.',
        ephemeral: true
      });
    }

    // Show edit modal (don't defer, just show modal directly)
    const modal = new ModalBuilder()
      .setCustomId(`staff_edit_modal_${messageId}`)
      .setTitle('Editar Mensagem de Staff')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('staff_edit_title')
            .setLabel('Título')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setValue(messageData.title)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('staff_edit_description')
            .setLabel('Descrição')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1024)
            .setValue(messageData.description)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleStaffMessageEdit:', error);
    try {
      if (interaction.deferred) {
        await interaction.followUp({
          content: '❌ Erro ao editar mensagem.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ Erro ao editar mensagem.',
          ephemeral: true
        });
      }
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Handle edit modal submission
 */
export async function handleStaffMessageEditModalSubmit(interaction, messageId) {
  try {
    await interaction.deferUpdate();

    const newTitle = interaction.fields.getTextInputValue('staff_edit_title');
    const newDescription = interaction.fields.getTextInputValue('staff_edit_description');

    // Find and update the message
    const guildMessages = staffMessages.get(interaction.guildId) || [];
    const messageData = guildMessages.find(m => m.id === messageId);

    if (!messageData) {
      return await interaction.followUp({
        content: '❌ Mensagem não encontrada.',
        ephemeral: true
      });
    }

    // Update data
    messageData.title = newTitle;
    messageData.description = newDescription;
    messageData.updatedAt = new Date();
    messageData.updatedBy = interaction.user.id;

    // Determine color
    const colorMap = {
      aviso: STAFF_THEME.info,
      reuniao: STAFF_THEME.primary,
      relatorio: STAFF_THEME.success,
      alerta: STAFF_THEME.error,
      anuncio: STAFF_THEME.warning,
      configuracao: STAFF_THEME.info
    };

    // Create updated embed
    const embed = createStaffMessageEmbed(
      newTitle,
      newDescription,
      messageData.type,
      colorMap[messageData.type] || STAFF_THEME.primary
    )
      .addFields({
        name: '👤 Criada por',
        value: `<@${messageData.authorId}>`,
        inline: true
      })
      .addFields({
        name: '📝 Editada por',
        value: `<@${interaction.user.id}>`,
        inline: true
      })
      .addFields({
        name: '📅 Data de Criação',
        value: messageData.createdAt.toLocaleDateString('pt-BR'),
        inline: true
      })
      .addFields({
        name: '⏰ Atualizada em',
        value: new Date().toLocaleDateString('pt-BR'),
        inline: true
      })
      .addFields({
        name: '🏷️ ID da Mensagem',
        value: `\`${messageId}\``,
        inline: false
      });

    // Update Discord message
    try {
      const message = await interaction.channel.messages.fetch(messageData.discordMessageId);
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`staff_edit_${messageId}`)
            .setLabel('Editar')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️'),
          new ButtonBuilder()
            .setCustomId(`staff_delete_${messageId}`)
            .setLabel('Deletar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️'),
          new ButtonBuilder()
            .setCustomId(`staff_view_${messageId}`)
            .setLabel('Ver Detalhes')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👁️')
        );

      await message.edit({
        embeds: [embed],
        components: [buttons]
      });
    } catch (e) {
      logger.warn('Failed to update Discord message:', e.message);
    }

    await interaction.followUp({
      content: `✅ Mensagem de staff **"${newTitle}"** atualizada com sucesso!`,
      ephemeral: true
    });

    logger.info('[STAFF_HANDLER] Staff message updated', {
      messageId: messageId,
      userId: interaction.user.id,
      updatedTitle: newTitle
    });

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleStaffMessageEditModalSubmit:', error);
    try {
      if (interaction.deferred) {
        await interaction.followUp({
          content: '❌ Erro ao atualizar mensagem.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ Erro ao atualizar mensagem.',
          ephemeral: true
        });
      }
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Handle delete button
 */
export async function handleStaffMessageDelete(interaction, messageId) {
  try {
    await interaction.deferUpdate();

    // Find the message
    const guildMessages = staffMessages.get(interaction.guildId) || [];
    const messageIndex = guildMessages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return await interaction.followUp({
        content: '❌ Mensagem não encontrada.',
        ephemeral: true
      });
    }

    const messageData = guildMessages[messageIndex];

    // Check permission
    if (messageData.authorId !== interaction.user.id && 
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.followUp({
        content: '❌ Apenas o criador ou administradores podem deletar esta mensagem.',
        ephemeral: true
      });
    }

    // Delete from storage
    guildMessages.splice(messageIndex, 1);

    // Try to delete Discord message
    try {
      const message = await interaction.channel.messages.fetch(messageData.discordMessageId);
      await message.delete();
    } catch (e) {
      logger.warn('Failed to delete Discord message:', e.message);
    }

    await interaction.followUp({
      content: `✅ Mensagem de staff **"${messageData.title}"** deletada com sucesso!`,
      ephemeral: true
    });

    logger.info('[STAFF_HANDLER] Staff message deleted', {
      messageId: messageId,
      userId: interaction.user.id,
      title: messageData.title
    });

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleStaffMessageDelete:', error);
    await interaction.followUp({
      content: '❌ Erro ao deletar mensagem.',
      ephemeral: true
    }).catch(e => logger.error('Failed to send error message:', e));
  }
}

/**
 * Handle view details button
 */
export async function handleStaffMessageView(interaction, messageId) {
  try {
    await interaction.deferUpdate();

    // Find the message
    const guildMessages = staffMessages.get(interaction.guildId) || [];
    const messageData = guildMessages.find(m => m.id === messageId);

    if (!messageData) {
      return await interaction.followUp({
        content: '❌ Mensagem não encontrada.',
        ephemeral: true
      });
    }

    // Create detailed view embed
    const embed = new EmbedBuilder()
      .setColor(STAFF_THEME.primary)
      .setTitle(`📋 Detalhes da Mensagem`)
      .addFields({
        name: '🏷️ ID',
        value: `\`${messageData.id}\``,
        inline: false
      })
      .addFields({
        name: '📝 Título',
        value: messageData.title,
        inline: false
      })
      .addFields({
        name: '📄 Descrição',
        value: messageData.description,
        inline: false
      })
      .addFields({
        name: '🏷️ Tipo',
        value: messageData.type.charAt(0).toUpperCase() + messageData.type.slice(1),
        inline: true
      })
      .addFields({
        name: '👤 Criada por',
        value: `<@${messageData.authorId}>`,
        inline: true
      })
      .addFields({
        name: '📅 Data de Criação',
        value: messageData.createdAt.toLocaleDateString('pt-BR'),
        inline: true
      });

    if (messageData.updatedAt) {
      embed.addFields({
        name: '✏️ Última Edição',
        value: messageData.updatedAt.toLocaleDateString('pt-BR'),
        inline: true
      });
    }

    await interaction.followUp({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    logger.error('[STAFF_HANDLER] Error in handleStaffMessageView:', error);
    try {
      if (interaction.deferred) {
        await interaction.followUp({
          content: '❌ Erro ao exibir detalhes da mensagem.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ Erro ao exibir detalhes da mensagem.',
          ephemeral: true
        });
      }
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Export functions for handler
 */
export {
  staffMessages,
  generateMessageId
};
