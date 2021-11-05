import { getCanvas, getGame } from './helpers';
import { polyglotIsActive } from './Hooks';
import { Polyglot } from './Polyglot';
import { VOICE_ACTOR_CHATTER_MODULE_NAME } from './settings';
import { VoiceActor } from './voiceactor';

const game = getGame();
const canvas = getCanvas();

export class VoiceActorChatter {
  static timer;

  getVoiceChatterTables = function () {
    const voiceActorFolder = <Folder>(
      game.folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase() == 'voice actor')[0]
    );
    if (!voiceActorFolder) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a folder with name (case insensitive) 'voice actor' on the rollTable sidebar.`,
      );
      return [];
    }
    const tables = <RollTable[]>(
      game.tables?.contents.filter(
        (x) => x.name?.toLowerCase().endsWith('voice') && x.data.folder == voiceActorFolder._id,
      )
    );
    if (!tables || tables.length == 0) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a rollTable with name '${voiceActorFolder.name}' and ends with the 'voice' suffix.`,
      );
      return [];
    }
    return tables;
  };

  getVoiceChatterPolyglotTables = function (lang: string) {
    const voiceActorFolder = <Folder>(
      game.folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase() == 'voice actor polyglot')[0]
    );
    if (!voiceActorFolder) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a folder with name (case insensitive) 'voice actor polyglot' on the rollTable sidebar.`,
      );
      return [];
    }
    // const map:Map<string,RollTable[]> = new Map<string,RollTable[]>();
    // languages.forEach((lang:string) =>{
    const tables = <RollTable[]>(
      game.tables?.contents.filter(
        (x) => x.name?.toLowerCase().endsWith('voice ' + lang) && x.data.folder == voiceActorFolder._id,
      )
    );
    // map.put(lang, tables);
    // });
    if (!tables || tables.length == 0) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a rollTable with name '${voiceActorFolder.name}' and ends with the 'voice' suffix.`,
      );
      return [];
    }
    return tables;
  };

  randomGlobalChatterEvery(milliseconds, options: any = {}) {
    VoiceActorChatter.timer = window.setInterval(() => {
      //@ts-ignore
      game.voiceActorChatter?.globalChatter(options);
    }, milliseconds);
  }

  async globalChatter(options: any = {}) {
    const tables: RollTable[] = this.getVoiceChatterTables();

    const userCharacterActorIds = <string[]>getGame()
      .users?.contents.filter((x: User) => x.character)
      .map((x) => x.character?.id);
    const activeScene = <Scene>game.scenes?.filter((x: Scene) => x.active)[0];
    const npcTokens = <TokenDocument[]>(
      activeScene.data.tokens.filter((x: TokenDocument) => !userCharacterActorIds.includes(<string>x.actor?.id))
    );

    const eligableTables: RollTable[] = tables.filter((x: RollTable) =>
      npcTokens.filter((t: TokenDocument) =>
        x.name?.toLowerCase().includes(t.name?.toLowerCase().replace(' voice', '').trim()),
      ),
    );

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    let table = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter((x: TokenDocument) =>
      x.name?.toLowerCase().includes(<string>table.name?.toLowerCase().replace(' voice', '').trim()),
    );

    const tokenIndex = Math.floor(Math.random() * eligableTokens.length + 0);
    const token = eligableTokens[tokenIndex];

    if (token == undefined) return;

    // Integration with polyglot
    if (polyglotIsActive) {
      const tablePolyglot = this._checkRollTablePolyglot([token], options);
      if (tablePolyglot) {
        table = tablePolyglot;
      }
    }

    const roll = await table.data.document.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // game.socket.emit("module."+VoiceActor.moduleName, {
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
    const tables: RollTable[] = this.getVoiceChatterTables();

    const eligableTables = tables.filter((x) =>
      token.name.toLowerCase().includes(<string>x.name?.toLowerCase().replace(' voice', '').trim()),
    );

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    let table: RollTable = eligableTables[tableIndex];

    // Integration with polyglot
    if (polyglotIsActive) {
      const tablePolyglot = this._checkRollTablePolyglot([token.document], options);
      if (tablePolyglot) {
        table = tablePolyglot;
      }
    }

    const roll = await table.data.document.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // game.socket.emit("module."+VoiceActor.moduleName, {
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
    const tables: RollTable[] = this.getVoiceChatterTables();

    const npcTokens = <Token[]>canvas.tokens?.controlled;

    const eligableTables = tables.filter((x) =>
      npcTokens.filter((t: Token) =>
        x.name?.toLowerCase().includes(t.name?.toLowerCase().replace(' voice', '').trim()),
      ),
    );

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    let table: RollTable = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter((x: Token) =>
      x.name?.toLowerCase().includes(<string>table.name?.toLowerCase().replace(' voice', '').trim()),
    );

    const tokenIndex = Math.floor(Math.random() * eligableTokens.length + 0);
    const token = eligableTokens[tokenIndex];

    if (token == undefined) return;

    // Integration with polyglot
    if (polyglotIsActive) {
      const tablePolyglot = this._checkRollTablePolyglot([token.document], options);
      if (tablePolyglot) {
        table = tablePolyglot;
      }
    }

    const roll = await table.data.document.roll();
    const result = roll.results[0].data.text;

    // Print on chat (Integration with NPCChatter)
    // game.socket.emit("module."+VoiceActor.moduleName, {
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

  _checkRollTablePolyglot(npcTokens: TokenDocument[], options: any = {}): RollTable | null {
    //@ts-ignore
    const polyglot: Polyglot = <Polyglot>window.polyglot.polyglot;
    const currentLanguageProvider: any = polyglot.LanguageProvider;

    // get actors from current targets usually just one
    const actors: Actor[] = [];
    npcTokens.forEach((t: TokenDocument) => {
      if (t.actor) {
        actors.push(t.actor);
      }
    });

    // Recover knowed languages of user
    const actorSource = <Actor>game.user?.character;
    const languagesSourceArray: Set<string>[] = polyglot.getUserLanguages([actorSource]);
    const languagesSource = new Set();
    for (const set of languagesSourceArray) {
      for (const element of set) {
        languagesSource.add(element);
      }
    }

    // Recover knowed languages of tokens
    const languagesTargetArray: Set<string>[] = polyglot.getUserLanguages(actors);
    const languagesTarget = new Set();
    for (const set of languagesTargetArray) {
      for (const element of set) {
        languagesTarget.add(element);
      }
    }

    const langNotKnow: string[] = [];
    const langKnow: string[] = [];
    languagesSource.forEach((lang: string) => {
      if (lang) {
        const conditions =
          !polyglot._isTruespeech(lang) &&
          !polyglot.known_languages.has(polyglot.comprehendLanguages) &&
          !currentLanguageProvider.conditions(polyglot, lang);
        // if (conditions) {
        //   // span.title = "????";
        //   // span.textContent = polyglot.scrambleString(span.textContent, journalSheet._id, lang);
        //   // span.style.font = polyglot._getFontStyle(lang);
        //   langNotKnow.push(lang);
        // }
        if (options.langs) {
          if (options.langs.includes(lang)) {
            langKnow.push(lang);
          } else {
            langNotKnow.push(lang);
          }
        } else {
          if (!conditions || Array.from(languagesTarget).includes(lang)) {
            langKnow.push(lang);
          } else {
            langNotKnow.push(lang);
          }
        }
      }
    });

    if (langKnow.length == 0 && langNotKnow.length > 0) {
      // For now I just get the first language not know from the actor
      const lang = langNotKnow[0];
      const tables: RollTable[] = this.getVoiceChatterPolyglotTables(lang);
      const eligableTablesPolyglot: RollTable[] = tables.filter((x: RollTable) =>
        npcTokens.filter((t: TokenDocument) =>
          x.name?.toLowerCase().includes(
            t.name
              ?.toLowerCase()
              .replace(' voice ' + lang, '')
              .trim(),
          ),
        ),
      );

      const tableIndexPolyglot = Math.floor(Math.random() * eligableTablesPolyglot.length + 0);
      const tablePolyglot = eligableTablesPolyglot[tableIndexPolyglot];
      return tablePolyglot;
    }
    return null;
  }
}
