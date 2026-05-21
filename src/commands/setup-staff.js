/**
 * /setup-staff Command - Staff Message Creator
 * 
 * Creates beautiful, professional staff messages directly in a channel.
 * No buttons, no metadata, no ephemeral visibility — just clean embeds.
 * 
 * Usage:
 *   /setup-staff canal:<#channel> titulo:<title> descricao:<description> [tipo:<type>] [cor:<hex>] [rodape:<footer>]
 * 
 * Restricted to Administrators only.
 */

import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder,
  ChannelType
} from 'discord.js';
import { logger } from '../utils/logger.js';
import { InteractionHelper } from '../utils/interactionHelper.js';

// Color presets by message type
const MESSAGE_TYPE_COLORS = {
  aviso: 0xF39C12,          // Yellow
  reuniao: 0x3498DB,        // Blue
  relatorio: 0x2ECC71,      // Green
  alerta: 0xE74C3C,         // Red
  anuncio: 0x9B59B6,        // Purple
  configuracao: 0x1a1a2e,   // Dark Blue
  boas_vindas: 0xFFD700,    // Gold
  regras: 0x8B0000          // Dark Red
};

const MESSAGE_TYPE_EMOJIS = {
  aviso: '📋',
  reuniao: '👥',
  relatorio: '📊',
  alerta: '⚠️',
  anuncio: '✨',
  configuracao: '🔧',
  boas_vindas: '👋',
  regras: '📋'
};

export default {
  data: new SlashCommandBuilder()
    .setName('setup-staff')
    .setDescription('Enviar uma mensagem de staff personalizada em um canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde a mensagem será enviada')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(option =>
      option
        .setName('titulo')
        .setDescription('Título da mensagem (ex: "REGRAS GERAIS")')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption(option =>
      option
        .setName('descricao')
        .setDescription('Conteúdo/descrição da mensagem')
        .setRequired(true)
        .setMaxLength(2048)
    )
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Tipo de mensagem (determina cor e emoji)')
        .setRequired(false)
        .addChoices(
          { name: '📋 Avisos', value: 'aviso' },
          { name: '👥 Reuniões', value: 'reuniao' },
          { name: '📊 Relatórios', value: 'relatorio' },
          { name: '⚠️ Alertas', value: 'alerta' },
          { name: '✨ Anúncios', value: 'anuncio' },
          { name: '🔧 Configurações', value: 'configuracao' },
          { name: '👋 Boas-vindas', value: 'boas_vindas' },
          { name: '📋 Regras', value: 'regras' }
        )
    )
    .addStringOption(option =>
      option
        .setName('cor')
        .setDescription('Cor do embed em HEX (ex: FF6347 para vermelho)')
        .setRequired(false)
        .setMaxLength(6)
    )
    .addStringOption(option =>
      option
        .setName('rodape')
        .setDescription('Texto do rodapé (ex: "Staff • Meu Servidor")')
        .setRequired(false)
        .setMaxLength(100)
    ),

  /**
   * Execute the /setup-staff command
   */
  async execute(interaction) {
    try {
      await InteractionHelper.safeDefer(interaction, { ephemeral: true });

      // Only administrators can use this command
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: '❌ Apenas administradores podem usar este comando.',
        });
      }

      // Get parameters
      const targetChannel = interaction.options.getChannel('canal');
      const titulo = interaction.options.getString('titulo');
      const descricao = interaction.options.getString('descricao');
      const tipo = interaction.options.getString('tipo') || 'anuncio';
      const corHex = interaction.options.getString('cor');
      const rodape = interaction.options.getString('rodape') || `Staff • ${interaction.guild.name}`;

      // Verify bot can send messages in target channel
      if (!targetChannel.permissionsFor(interaction.client.user).has('SendMessages')) {
        return await InteractionHelper.safeEditReply(interaction, {
          content: '❌ Não tenho permissão para enviar mensagens neste canal.'
        });
      }

      // Determine color
      let cor = MESSAGE_TYPE_COLORS[tipo] || MESSAGE_TYPE_COLORS.anuncio;
      if (corHex) {
        try {
          cor = parseInt(corHex, 16);
        } catch (e) {
          logger.warn('Invalid hex color provided:', corHex);
          // Use default color if parsing fails
        }
      }

      // Get emoji based on type
      const emoji = MESSAGE_TYPE_EMOJIS[tipo] || '📢';

      // Create the professional staff message embed
      const staffEmbed = new EmbedBuilder()
        .setColor(cor)
        .setTitle(`${emoji} — ${titulo.toUpperCase()}`)
        .setDescription(descricao)
        .setFooter({ text: rodape })
        .setTimestamp();

      // Send the message to the target channel
      const sentMessage = await targetChannel.send({
        embeds: [staffEmbed]
      });

      // Reply to the command with a simple ephemeral confirmation
      await InteractionHelper.safeEditReply(interaction, {
        content: `✅ Mensagem de staff enviada com sucesso em ${targetChannel}!\n**Tipo:** ${tipo} | **Cor:** #${cor.toString(16).toUpperCase().padStart(6, '0')}`
      });

      logger.info('[STAFF_SETUP] Staff message sent', {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: targetChannel.id,
        messageId: sentMessage.id,
        type: tipo,
        title: titulo
      });

    } catch (error) {
      logger.error('Error in setup-staff command:', error);
      
      try {
        await InteractionHelper.safeEditReply(interaction, {
          content: '❌ Erro ao enviar mensagem de staff. Verifique as permissões e tente novamente.'
        });
      } catch (e) {
        logger.error('Failed to send error response:', e);
      }
    }
  }
};
