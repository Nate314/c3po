// Checks that failing Discord calls and a broken mcsrvstat response are logged instead of
// killing the bot (node >= 15 exits on an unhandled rejection).
// Run against the built image: docker run --rm -v "$PWD/test:/app/test:ro" <image> node test/survives-failures.js
const assert = require('assert');
const path = require('path');
const dist = p => path.join(process.cwd(), 'dist', p);

process.env.DISCORD_TOKEN = 'fake';
require('discord.js').Client.prototype.login = () => new Promise(() => {});
const page = { setViewport: async () => {}, goto: async () => {}, screenshot: async () => {} };
require('puppeteer').default.launch = async () => ({ newPage: async () => page });

const errors = [];
const consoleError = console.error;
console.error = (...args) => { errors.push(args.map(String).join(' ')); consoleError(...args); };
console.log = () => {};

require(dist('main.js'));
const { cacheMCServerStatusRequest, updateMCServerStatusMessages } = require(dist('src/commands.js'));
require(dist('src/Utility.js')).Browser.page = page;

globalThis.fetch = async url => url.includes('down.example')
    ? { ok: true, json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } }
    : { ok: true, json: async () => ({ players: { list: ['a'] }, hostname: 'up.example', online: true, motd: { clean: ['motd'] } }) };

const botMessage = () => ({
    author: { username: 'c3po', discriminator: '1433', id: '1' },
    guild: { members: { me: { setNickname: () => Promise.reject(new Error('Missing Permissions')) } } },
    channel: { send: async () => botMessage() },
    delete: () => Promise.reject(new Error('Unknown Message')),
});
cacheMCServerStatusRequest({ serverName: 'down', serverAddress: 'down.example', message: botMessage() });
cacheMCServerStatusRequest({ serverName: 'up', serverAddress: 'up.example', message: botMessage() });
updateMCServerStatusMessages();

setTimeout(() => {
    for (const expected of ['Unexpected token', 'Missing Permissions', 'Unknown Message', 'ENOENT']) {
        assert(errors.some(e => e.includes(expected)), `expected a logged error containing "${expected}"`);
    }
    process.stdout.write('PASS: bot survived and logged every failure\n');
    process.exit(0);
}, 9000);
