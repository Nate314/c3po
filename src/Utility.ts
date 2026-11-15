import { APIEmbed } from 'discord.js';
import { Embed } from './commands';

export function makeEmbed(title: APIEmbed | string, description?: string, imageurl?: string, imageName?: string, footer?: string): Embed {
    if (typeof title !== 'string') return { embeds: [title] };
    const richEmbed: APIEmbed = { color: 3447003, title: title };
    const result: Embed = { embeds: [richEmbed] };
    if (description) richEmbed.description = description;
    if (imageurl) richEmbed.image = { url: imageurl };
    if (footer) richEmbed.footer = { text: footer };
    if (imageName) {
        // const fs = require('fs');
        // const buffer = fs.readFileSync(`./${imageName}`);
        result.files = [ imageName ];
        // richEmbed.image = {
        //     url: `attachment://${imageName}`
        // };
    }
    richEmbed.timestamp = new Date().toISOString();
    return result;
}

export class Browser {
    private static _browser;
    private static _page;
    public static set browser(val) { this._browser = val; }
    public static get browser() { return this._browser; }
    public static set page(val) { this._page = val; }
    public static get page() { return this._page; }
}
