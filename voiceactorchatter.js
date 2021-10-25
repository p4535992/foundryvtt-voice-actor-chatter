import { VoiceActor } from "./voiceactor";

export class VoiceActorChatter {

  static timer;

  getChatterTables = function() {
    const voiceActorFolder = game.folders.contents.filter(x => x.type == "RollTable" && x.name.toLowerCase() == "voice actor")[0];
    const tables = game.tables.contents.filter(x => x.name.toLowerCase().endsWith("voice") || x.data.folder == voiceActorFolder._id);
    return tables;
  }

  randomGlobalChatterEvery(milliseconds, options={}) {
    VoiceActorChatter.timer = window.setInterval(() => { game.VoiceActorChatter.globalChatter(options); }, milliseconds);
  }

  async globalChatter(options={}) {
    const tables = this.getChatterTables();

    const userCharacterActorIds = game.users.contents.filter(x => x.character).map(x => x.character.id);
    const activeScene = game.scenes.filter(x => x.active)[0];
    const npcTokens = activeScene.data.tokens.filter(x => !userCharacterActorIds.includes(x.actorId));

    const eligableTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("voice", "").trim()) > 0));

    const tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    const table = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter(x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("voice", "").trim()));

    const tokenIndex = Math.floor((Math.random() * eligableTokens.length) + 0);
    const token = eligableTokens[tokenIndex];

    if (token == undefined) return;
    let roll = await table.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // game.socket.emit("module."+VoiceActor.moduleName, {
    //   tokenId: token.data._id,
    //   msg: result
    // });
    // const emote = Object.keys(options).length ? {emote: options} : false;
    //await canvas.hud.bubbles.say(token.data, result, emote);

    // Play Sounds
    let fileClipPlayPath = VoiceActor.getClipFromRollTableRow(token.data, null, result);
    // Play file
    VoiceActor.playClip(fileClipPlayPath, true);
  }

  async tokenChatter(token, options={}) {
    const tables = this.getChatterTables();

    const eligableTables = tables.filter(x => token.name.toLowerCase().includes(x.name.toLowerCase().replace("voice", "").trim()));

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    const table = eligableTables[tableIndex];
    let roll = await table.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // game.socket.emit("module."+VoiceActor.moduleName, {
    //   tokenId: token.data._id,
    //   msg: result
    // });
    // const emote = Object.keys(options).length ? {emote: options} : false;
    // await canvas.hud.bubbles.say(token.data, result, emote);

    // Play Sounds
    let fileClipPlayPath = VoiceActor.getClipFromRollTableRow(token.data, null, result);
    // Play file
    VoiceActor.playClip(fileClipPlayPath, true);
  }

  async selectedChatter(options={}) {
    const tables = this.getChatterTables();

    const npcTokens = canvas.tokens.controlled;

    const eligableTables = tables.filter(x => npcTokens.filter(t => x.name.toLowerCase().includes(t.name.toLowerCase().replace("voice", "").trim()) > 0));

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor((Math.random() * eligableTables.length) + 0);
    const table = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter(x => x.name.toLowerCase().includes(table.name.toLowerCase().replace("voice", "").trim()));

    const tokenIndex = Math.floor((Math.random() * eligableTokens.length) + 0);
    const token = eligableTokens[tokenIndex];
    let roll = await table.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // game.socket.emit("module."+VoiceActor.moduleName, {
    //   tokenId: token.id,
    //   msg: result
    // });
    // const emote = Object.keys(options).length ? {emote: options} : false;
    // await canvas.hud.bubbles.say(token, result, emote);

    // Play Sounds
    let fileClipPlayPath = VoiceActor.getClipFromRollTableRow(token.data, null, result);
    // Play file
    VoiceActor.playClip(fileClipPlayPath, true);
  }

  async turnOffGlobalTimerChatter() {
	  window.clearInterval(VoiceActorChatter.timer);
	  VoiceActorChatter.timer = undefined;
  }
}
