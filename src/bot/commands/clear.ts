import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    TextChannel,
  } from "discord.js";
  
  export async function handleClearCommand(i: ChatInputCommandInteraction) {
    // 🔒 só staff
    if (!i.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      return; // silencioso
    }
  
    const channel = i.channel;
    if (!channel || channel.type !== 0) return; // só texto
  
    // ⚠️ não responder nada
    await i.deferReply({ ephemeral: true }).catch(() => {});
  
    const textChannel = channel as TextChannel;
  
    try {
      while (true) {
        const messages = await textChannel.messages.fetch({ limit: 100 });
        if (messages.size === 0) break;
  
        // só mensagens < 14 dias
        const deletable = messages.filter(m => m.deletable);
        if (deletable.size === 0) break;
  
        await textChannel.bulkDelete(deletable, true);
      }
    } catch {
      // ignora erro (ex: mensagem antiga demais)
    }
  
    // ❌ NÃO responder nada
    try {
      await i.deleteReply();
    } catch {}
  }
  