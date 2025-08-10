require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});

setInterval(() => {
  console.log('Bot is alive');
}, 60000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

const COLOR_CHANNEL_ID = '1403866238442143774';
const MOD_USER_ID = '256050613316485120';
const UNVERIFIED_ROLE_ID = '1403878529686438040';
const VERIFIED_ROLE_ID = '1392683511898701875';
const VERIFY_CHANNEL_ID = '1404108149811707904';

const allColors = {
    'FF0000': 'Red',
    '0000FF': 'Blue', 
    '00FF00': 'Green',
    'FFFF00': 'Yellow',
    '9B59B6': 'Purple',
    'FF69B4': 'Pink',
    'FF8C00': 'Orange',
    '00CED1': 'Light Blue',
    'FFFFFF': 'White',
    '010101': 'Black',
    '8B4513': 'Brown',
    '32CD32': 'Lime',
    '000080': 'Navy',
    'FFD700': 'Gold',
    '808080': 'Gray',
    '8B0000': 'Dark Red',
    '4B0082': 'Dark Purple',
    'FF7F50': 'Coral',
    'FF1493': 'Hot Pink',
    'FF00FF': 'Magenta',
    '00FFFF': 'Aqua',
    '228B22': 'Forest Green',
    'FA8072': 'Salmon',
    'FFBF00': 'Amber'
};

client.on('ready', async () => {
    await client.user.setStatus('dnd');
    await client.user.setActivity('looksmaxxing videos', { type: 3 });

    const commands = [
        new SlashCommandBuilder()
            .setName('color')
            .setDescription('Change your name color')
            .addStringOption(option =>
                option.setName('color')
                    .setDescription('Choose a color or type "remove"')
                    .setRequired(true)
                    .setAutocomplete(true)
            ),

        new SlashCommandBuilder()
            .setName('panel')
            .setDescription('setup panel'),

        new ContextMenuCommandBuilder()
            .setName('Mod Call')
            .setType(ApplicationCommandType.Message)
    ];

    await client.application.commands.set(commands);

    for (const guild of client.guilds.cache.values()) {
        const botRole = guild.members.me.roles.highest;

        for (const [hexColor, colorName] of Object.entries(allColors)) {
            const colorWithHash = `#${hexColor}`;
            const existingRole = guild.roles.cache.find(role => 
                role.hexColor.toUpperCase() === colorWithHash.toUpperCase() && 
                role.name === '⠀'
            );

            if (!existingRole) {
                try {
                    await guild.roles.create({
                        name: '⠀',
                        color: colorWithHash,
                        reason: `Color role setup - ${colorName}`,
                        position: botRole.position - 1
                    });
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (err) {}
            }
        }
    }

    for (const guild of client.guilds.cache.values()) {
        const role = guild.roles.cache.find(r => r.name === '🎓 Moderator');
        if (!role) continue;

        await guild.members.fetch();
        const membersWithRole = role.members;

        for (const member of membersWithRole.values()) {
            if (!member.displayName.startsWith('🎓 ')) {
                const baseName = member.displayName.replace(/^🎓\s*/, '');
                try {
                    await member.setNickname(`🎓 ${baseName}`);
                } catch (err) {}
            }
        }
    }
});

client.on('guildMemberAdd', async (member) => {
    try {
        const unverifiedRole = member.guild.roles.cache.get(UNVERIFIED_ROLE_ID);
        if (unverifiedRole) {
            await member.roles.add(unverifiedRole);
        }
    } catch (error) {}
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'verify_start') {
            const rulesEmbed = new EmbedBuilder()
                .setTitle('📋 Server Rules')
                .setDescription(`
**Please read and agree to our server rules:**

**1. Be Respectful:** Treat everyone with respect. No harassment, bullying, or hate speech.

**2. No Inappropriate Content:** Avoid posting NSFW or offensive content.

**3. No Spamming:** Do not spam messages, emojis, or links.

**4. No Self-Promotion:** Self-promotion, advertising, or soliciting is not allowed without permission.

**5. Use Appropriate Channels:** Keep conversations relevant to the channel topics.

**6. No Illegal Activities:** Do not discuss or engage in illegal activities.

**7. Respect Privacy:** Do not share personal information or private conversations without consent.

**8. No Impersonation:** Do not impersonate other members or staff.

**9. Follow Discord's Terms of Service:** Abide by Discord's community guidelines and terms of service.

**10. No Alternate Accounts:** Do not use multiple accounts to evade bans or restrictions.

By clicking "Agree", you agree to follow these rules.
                `)
                .setColor(0xFF8C00)
                .setTimestamp();

            const confirmButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_confirm')
                        .setLabel('Agree')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅')
                );

            await interaction.reply({
                embeds: [rulesEmbed],
                components: [confirmButton],
                ephemeral: true
            });
        }

        if (interaction.customId === 'verify_confirm') {
            try {
                const member = interaction.guild.members.cache.get(interaction.user.id);

                if (member) {
                    if (!member.roles.cache.has(UNVERIFIED_ROLE_ID)) {
                        await interaction.reply({
                            content: 'You are already verified!',
                            ephemeral: true
                        });
                        return;
                    }

                    const unverifiedRole = interaction.guild.roles.cache.get(UNVERIFIED_ROLE_ID);
                    if (unverifiedRole) {
                        await member.roles.remove(unverifiedRole);
                    }

                    const verifiedRole = interaction.guild.roles.cache.get(VERIFIED_ROLE_ID);
                    if (verifiedRole) {
                        await member.roles.add(verifiedRole);
                    }

                    const successEmbed = new EmbedBuilder()
                        .setTitle('Verification Complete')
                        .setDescription('You now have access to the server!')
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await interaction.reply({
                        embeds: [successEmbed],
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: 'Error: Could not find you in the server.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                await interaction.reply({
                    content: 'An error occurred during verification. Please contact a moderator.',
                    ephemeral: true
                });
            }
        }
    }

    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'color') {
            if (interaction.channelId !== COLOR_CHANNEL_ID) {
                await interaction.respond([]);
                return;
            }

            const focusedValue = interaction.options.getFocused().toLowerCase();
            const availableColors = Object.entries(allColors).map(([hex, name]) => ({
                name: name,
                value: hex
            }));

            availableColors.push({ name: 'Remove Color', value: 'remove' });

            const filtered = availableColors.filter(choice =>
                choice.name.toLowerCase().includes(focusedValue)
            ).slice(0, 25);

            await interaction.respond(filtered);
        }
        return;
    }

    if (interaction.isMessageContextMenuCommand()) {
        if (interaction.commandName === 'Mod Call') {
            await interaction.deferReply({ ephemeral: true });

            const targetMessage = interaction.targetMessage;
            const reporter = interaction.user;

            try {
                const modUser = await client.users.fetch(MOD_USER_ID);

                const reportContent = {
                    embeds: [{
                        title: '🚨 Moderator Called',
                        color: 0xFF0000,
                        fields: [
                            {
                                name: '📍 Channel',
                                value: `${interaction.channel}`,
                                inline: true
                            },
                            {
                                name: '📢 Reported By',
                                value: `${reporter} (${reporter.tag})`,
                                inline: true
                            },
                            {
                                name: '👤 Message Author',
                                value: `${targetMessage.author} (${targetMessage.author.tag})`,
                                inline: true
                            },
                            {
                                name: '🔗 Quick Actions',
                                value: `[Jump to Message](${targetMessage.url})`,
                                inline: true
                            },
                            {
                                name: '📍 Reported Message',
                                value: `\`\`\`${targetMessage.content.slice(0, 1000) || '*No text content*'}\`\`\``,
                                inline: false
                            }
                        ],
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `Report ID: ${targetMessage.id}`
                        }
                    }]
                };

                await modUser.send(reportContent);
                await interaction.editReply('A mod has been called.');
            } catch (error) {
                await interaction.editReply('Failed to send report. Report to @0o4o!');
            }
        }
    }

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'panel') {
            if (interaction.user.id !== MOD_USER_ID) {
                await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true
                });
                return;
            }

            const panelEmbed = new EmbedBuilder()
                .setTitle('💹 Verification')
                .setDescription('Welcome to the server! Please click the button below to verify yourself and gain access to all channels.')
                .setColor(0x00FF00)
                .setTimestamp();

            const verifyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify_start')
                        .setLabel('Verify')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✅')
                );

            await interaction.reply({
                embeds: [panelEmbed],
                components: [verifyButton]
            });
        }

        if (interaction.commandName === 'color') {
            if (interaction.channelId !== COLOR_CHANNEL_ID) {
                await interaction.reply({ 
                    content: 'You can only use this command in the designated bot-cmds channel!', 
                    ephemeral: true 
                });
                return;
            }

            await interaction.deferReply({ ephemeral: true });

            const colorChoice = interaction.options.getString('color').toUpperCase();
            const guild = interaction.guild;
            const member = interaction.member;

            try {
                const existingColorRoles = member.roles.cache.filter(role => 
                    role.name === '⠀'
                );

                if (existingColorRoles.size > 0) {
                    await member.roles.remove(existingColorRoles);
                }

                if (colorChoice === 'REMOVE') {
                    await interaction.editReply('Successfully set your color.');
                    return;
                }

                const colorWithHash = `#${colorChoice}`;

                let colorRole = guild.roles.cache.find(role => 
                    role.hexColor.toUpperCase() === colorWithHash.toUpperCase() && 
                    role.name === '⠀'
                );

                if (!colorRole) {
                    return interaction.editReply('Report this error to @0o4o; role color exist nil');
                }

                await member.roles.add(colorRole);
                await interaction.editReply('Successfully set your color.');
            } catch (error) {
                await interaction.editReply('Failed to change color. Report to @0o4o!');
            }
        }
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const roleName = '🎓 Moderator';
    const role = newMember.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return;

    const hadRoleBefore = oldMember.roles.cache.has(role.id);
    const hasRoleNow = newMember.roles.cache.has(role.id);

    if (hasRoleNow && !hadRoleBefore) {
        const baseName = newMember.displayName.replace(/^🎓\s*/, '');
        try {
            await newMember.setNickname(`🎓 ${baseName}`);
        } catch (err) {}
    }

    if (!hasRoleNow && hadRoleBefore) {
        const baseName = newMember.displayName.replace(/^🎓\s*/, '');
        try {
            await newMember.setNickname(baseName);
        } catch (err) {}
    }
});

client.login(process.env.DISCORD_TOKEN);
