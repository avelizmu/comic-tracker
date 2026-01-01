import { REST, Routes, Client, Events, GatewayIntentBits, SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, ButtonInteraction } from 'discord.js';
import { promises as fs } from 'fs'

type Command = {
    data: SlashCommandBuilder,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>
    buttonExecute?: (interaction: ButtonInteraction) => Promise<void>
}

type CommandClient = Client & {
    commands: Map<string, Command>
}

async function initDiscord(token: string, clientId: string) {
    const client: CommandClient = new Client({ intents: [GatewayIntentBits.Guilds] }) as CommandClient;
    client.commands = new Map();
    
    const commands = await getCommands();
    for(const command of commands) {
        client.commands.set(command.data.name, command);
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands.map(command => command.data.toJSON()) },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    client.once(Events.ClientReady, () => {
        console.log('Discord client is ready!');
    });
    
    client.on(Events.InteractionCreate, async interaction => {
        if(!interaction.isChatInputCommand() && !interaction.isAutocomplete()) 
            return;

        const command = client.commands.get(interaction.commandName);
        if(!command) 
            return;
        
        try {
            if(interaction.isChatInputCommand()) {
                await command.execute(interaction);
            }
            else if(interaction.isAutocomplete() && command.autocomplete) {
                await command.autocomplete(interaction);
            }
        } catch (error) {
            console.error(error);
        }
    });

    client.on(Events.InteractionCreate, async interaction => {
        if(!interaction.isButton()) 
            return;

        const command = client.commands.get(interaction.customId.split('_')[0]);
        if(!command) 
            return;
        
        try {
            if(interaction.isButton() && command.buttonExecute) {
                await command.buttonExecute(interaction);
            }
        } catch (error) {
            console.error(error);
        }
    });

    await client.login(token);
}

async function getCommands(): Promise<Command[]> {
    const commandFiles = await fs.readdir('./src/commands');

    const commands: Command[] = [];

    for(const file in commandFiles) {
        const command = await import(`./commands/${commandFiles[file]}`);
        commands.push(command);
    }

    return commands;
}

export { initDiscord };