import { getCanvas, getGame, VOICE_ACTOR_CHATTER_MODULE_NAME } from './settings';
import { VoiceActor } from './voiceactor';

export class VoiceActorChatter {
  static timer;

  getChatterTables = function () {
    const voiceActorFolder = <Folder>(
      getGame().folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase() == 'voice actor')[0]
    );
    if (!voiceActorFolder) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a folder with name (case insensitive) 'voice actor' on the rollTable sidebar.`,
      );
      return [];
    }
    const tables = <RollTable[]>(
      getGame().tables?.contents.filter(
        (x) => x.name?.toLowerCase().endsWith('voice') || x.data.folder == voiceActorFolder._id,
      )
    );
    if (!tables || tables.length == 0) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a rollTable with name '${voiceActorFolder._id}' and ends with the 'voice' suffix.`,
      );
      return [];
    }
    return tables;
  };

  randomGlobalChatterEvery(milliseconds, options: any = {}) {
    VoiceActorChatter.timer = window.setInterval(() => {
      //@ts-ignore
      getGame().voiceActorChatter?.globalChatter(options);
    }, milliseconds);
  }

  async globalChatter(options: any = {}) {
    const tables: RollTable[] = this.getChatterTables();

    const userCharacterActorIds = <string[]>getGame()
      .users?.contents.filter((x: User) => x.character)
      .map((x) => x.character?.id);
    const activeScene = <Scene>getGame().scenes?.filter((x: Scene) => x.active)[0];
    const npcTokens = <TokenDocument[]>(
      activeScene.data.tokens.filter((x: TokenDocument) => !userCharacterActorIds.includes(<string>x.actor?.id))
    );

    const eligableTables: RollTable[] = tables.filter((x: RollTable) =>
      npcTokens.filter((t: TokenDocument) =>
        x.name?.toLowerCase().includes(t.name?.toLowerCase().replace(' voice', '').trim()),
      ),
    );

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    const table = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter((x: TokenDocument) =>
      x.name?.toLowerCase().includes(<string>table.name?.toLowerCase().replace(' voice', '').trim()),
    );

    const tokenIndex = Math.floor(Math.random() * eligableTokens.length + 0);
    const token = eligableTokens[tokenIndex];

    if (token == undefined) return;

    const roll = await table.data.document.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // getGame().socket.emit("module."+VoiceActor.moduleName, {
    //   tokenId: token.data._id,
    //   msg: result
    // });
    // const emote = Object.keys(options).length ? {emote: options} : false;
    //await getCanvas().hud.bubbles.say(token.data, result, emote);

    // Play Sounds File
    const toAll = options.toAll ?? false;
    VoiceActor.playClip(result, toAll);
  }

  async tokenChatter(token: Token, options: any = {}) {
    const tables: RollTable[] = this.getChatterTables();

    const eligableTables = tables.filter((x) =>
      token.name.toLowerCase().includes(<string>x.name?.toLowerCase().replace(' voice', '').trim()),
    );

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    const table: RollTable = eligableTables[tableIndex];

    const roll = await table.data.document.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // getGame().socket.emit("module."+VoiceActor.moduleName, {
    //   tokenId: token.data._id,
    //   msg: result
    // });
    // const emote = Object.keys(options).length ? {emote: options} : false;
    // await getCanvas().hud.bubbles.say(token.data, result, emote);

    // Play Sounds File
    const toAll = options.toAll ?? false;
    VoiceActor.playClip(result, toAll);
  }

  async selectedChatter(options: any = {}) {
    const tables: RollTable[] = this.getChatterTables();

    const npcTokens = <Token[]>getCanvas().tokens?.controlled;

    const eligableTables = tables.filter((x) =>
      npcTokens.filter((t: Token) =>
        x.name?.toLowerCase().includes(t.name?.toLowerCase().replace(' voice', '').trim()),
      ),
    );

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    const table: RollTable = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter((x: Token) =>
      x.name?.toLowerCase().includes(<string>table.name?.toLowerCase().replace(' voice', '').trim()),
    );

    const tokenIndex = Math.floor(Math.random() * eligableTokens.length + 0);
    const token = eligableTokens[tokenIndex];

    const roll = await table.data.document.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // getGame().socket.emit("module."+VoiceActor.moduleName, {
    //   tokenId: token.id,
    //   msg: result
    // });
    // const emote = Object.keys(options).length ? {emote: options} : false;
    // await getCanvas().hud.bubbles.say(token, result, emote);

    // Play Sounds File
    const toAll = options.toAll ?? false;
    VoiceActor.playClip(result, toAll);
  }

  async turnOffGlobalTimerChatter() {
    window.clearInterval(VoiceActorChatter.timer);
    VoiceActorChatter.timer = undefined;
  }
}
