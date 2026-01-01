import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, MessageFlags } from 'discord.js';

import { db } from '../database';
import { Comic } from '../database_types/comic';

export const data = new SlashCommandBuilder()
    .setName('addcomicalias')
    .setDescription('Adds a new alias to a comic')
    .addStringOption(option => 
        option.setName('comic')
            .setDescription('The comic to add an alias to')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option => 
        option.setName('alias')
            .setDescription('The alias to add')
            .setRequired(true)
    );
    
export async function execute(interaction: ChatInputCommandInteraction ) {
    const comic = interaction.options.getString('comic', true);
    const alias = interaction.options.getString('alias', true);

    try {
        // Check if comic is a number (passed by autocomplete) and use that as ID or look up the comic by name
        let comicId: number;
        if(Number.isInteger(parseInt(comic))) {
            comicId = parseInt(comic);
        }
        else {
            comicId = (await db.selectFrom('comic').selectAll().where('name', '=', comic).executeTakeFirstOrThrow() as Comic).id;
        }

        await db.insertInto('comic_alias')
        .values({
            comic_id: comicId,
            alias,
        })
        .execute();
    }
    catch (error) {
        console.error('Error adding alias:', error);
        await interaction.reply({ content: 'There was an error adding the alias. Please try again later.', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ content: `Alias added: ${alias} to comic: ${comic}`, flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();

    // Search both comics and aliases
    const comics = await db.selectFrom('comic').selectAll().where('name', 'like', `%${focusedValue}%`).limit(25).execute();
    const aliases = await db.selectFrom('comic_alias').selectAll().where('alias', 'like', `%${focusedValue}%`).limit(25).execute();

    await interaction.respond(
        // Merge and sort results
        [...comics.map(comic => ({ name: comic.name, value: comic.id.toString() })), ...aliases.map(alias => ({ name: alias.alias, value: alias.comic_id.toString() }))].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 25)
    );
}