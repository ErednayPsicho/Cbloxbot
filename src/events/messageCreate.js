




import { Events, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import QRCode from 'qrcode';
import pixKeys from '../../pixKeys.js';
import { logger } from '../utils/logger.js';
import { getLevelingConfig, getUserLevelData } from '../services/leveling.js';
import { addXp } from '../services/xpSystem.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

const MESSAGE_XP_RATE_LIMIT_ATTEMPTS = 12;
const MESSAGE_XP_RATE_LIMIT_WINDOW_MS = 10000;

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      
      if (message.author.bot || !message.guild) return;

      await handleLeveling(message, client);
      await handlePixAutomatic(message, client);
    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};








async function handleLeveling(message, client) {
  try {
    const rateLimitKey = `xp-event:${message.guild.id}:${message.author.id}`;
    const canProcess = await checkRateLimit(rateLimitKey, MESSAGE_XP_RATE_LIMIT_ATTEMPTS, MESSAGE_XP_RATE_LIMIT_WINDOW_MS);
    if (!canProcess) {
      return;
    }

    const levelingConfig = await getLevelingConfig(client, message.guild.id);
    
    if (!levelingConfig?.enabled) {
      return;
    }

    
    if (levelingConfig.ignoredChannels?.includes(message.channel.id)) {
      return;
    }

    
    if (levelingConfig.ignoredRoles?.length > 0) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => {
        return null;
      });
      if (member && member.roles.cache.some(role => levelingConfig.ignoredRoles.includes(role.id))) {
        return;
      }
    }

    
    if (levelingConfig.blacklistedUsers?.includes(message.author.id)) {
      return;
    }

    
    if (!message.content || message.content.trim().length === 0) {
      return;
    }

    const userData = await getUserLevelData(client, message.guild.id, message.author.id);
    
    
    const cooldownTime = levelingConfig.xpCooldown || 60;
    const now = Date.now();
    const timeSinceLastMessage = now - (userData.lastMessage || 0);
    
    
    if (timeSinceLastMessage < cooldownTime * 1000) {
      return;
    }

    
    const minXP = levelingConfig.xpRange?.min || levelingConfig.xpPerMessage?.min || 15;
    const maxXP = levelingConfig.xpRange?.max || levelingConfig.xpPerMessage?.max || 25;

    
    const safeMinXP = Math.max(1, minXP);
    const safeMaxXP = Math.max(safeMinXP, maxXP);

    
    const xpToGive = Math.floor(Math.random() * (safeMaxXP - safeMinXP + 1)) + safeMinXP;

    
    let finalXP = xpToGive;
    if (levelingConfig.xpMultiplier && levelingConfig.xpMultiplier > 1) {
      finalXP = Math.floor(finalXP * levelingConfig.xpMultiplier);
    }

    
    const result = await addXp(client, message.guild, message.member, finalXP);
    
    if (result.success && result.leveledUp) {
      logger.info(
        `${message.author.tag} leveled up to level ${result.level} in ${message.guild.name}`
      );
    }
  } catch (error) {
    logger.error('Error handling leveling for message:', error);
  }
}

async function handlePixAutomatic(message, client) {
  try {
    const ticketCategoryId = '1505618166922084575';
    const middlemanRoleId = '1505618270492033094';
    const logChannelId = '1506667572383453374';

    const parentId = message.channel.parentId;
    if (parentId !== ticketCategoryId) return;

    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member || !member.roles.cache.has(middlemanRoleId)) return;

    const existingBotPixEmbed = await message.channel.messages.fetch({ limit: 50 })
      .then(messages => messages.some(msg => msg.author.id === client.user.id && msg.embeds.some(embed => embed.title === '💰 Pagamento via Pix')))
      .catch(() => false);
    if (existingBotPixEmbed) return;

    const chave = pixKeys[message.author.id];
    if (!chave) {
      return message.channel.send({
        content: `⚠️ <@${message.author.id}> não possui chave Pix cadastrada. Contate um administrador.`
      });
    }

    const qrBuffer = await QRCode.toBuffer(chave, { width: 300 });
    const attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' });

    const embed = new EmbedBuilder()
      .setColor(0x00b300)
      .setTitle('💰 Pagamento via Pix')
      .setDescription(
        `O Middleman **${member.displayName}** assumiu este ticket.\n\n` +
        `Utilize os dados abaixo para realizar o pagamento:\n\n` +
        `**🔑 Chave Pix:**\n\n` +
        `\`\`\`${chave}\`\`\`\n\n` +
        `📷 **QR Code abaixo — escaneie para pagar:**`
      )
      .setImage('attachment://qrcode.png')
      .setFooter({ text: 'Após realizar o pagamento, aguarde a confirmação do MM.' });

    await message.channel.send({ embeds: [embed], files: [attachment] });

    const canalLogs = client.channels.cache.get(logChannelId);
    if (canalLogs) {
      const embedLog = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📋 MM assumiu ticket')
        .addFields(
          { name: 'MM', value: `<@${message.author.id}>`, inline: true },
          { name: 'Canal', value: `<#${message.channel.id}>`, inline: true },
          { name: 'Chave Pix', value: `\`${chave}\``, inline: false }
        )
        .setTimestamp();
      await canalLogs.send({ embeds: [embedLog] });
    }
  } catch (error) {
    logger.error('Error handling Pix automatic message for ticket:', error);
  }
}


