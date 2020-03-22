import { RichEmbed } from 'discord.js';
import { Embed } from './commands';

export function makeEmbed(title: RichEmbed | string, description?: string, imageurl?: string, file?: string): Embed {
    if (title['split'] === undefined) return <Embed> { embed: <RichEmbed> title };
    const richEmbed = <RichEmbed> { color: 3447003, title: title };
    if (description) richEmbed.description = description;
    if (imageurl) richEmbed.image = { url: imageurl };
    if (file) richEmbed.files = [ file ];
    return <Embed> { embed: richEmbed };
}
