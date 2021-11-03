import { polyglotIsActive } from './Hooks';
import { Polyglot } from './Polyglot';
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

  getChatterPolyglotTables = function (lang:string[]) {
    const voiceActorFolder = <Folder>(
      getGame().folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase() == 'voice actor polyglot')[0]
    );
    if (!voiceActorFolder) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a folder with name (case insensitive) 'voice actor' on the rollTable sidebar.`,
      );
      return [];
    }
    const map:Map<string,RollTable[]> = new Map<string,RollTable[]>();
    // languages.forEach((lang:string) =>{
      const tables = <RollTable[]>(
        getGame().tables?.contents.filter(
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
    let table = eligableTables[tableIndex];

    const eligableTokens = npcTokens.filter((x: TokenDocument) =>
      x.name?.toLowerCase().includes(<string>table.name?.toLowerCase().replace(' voice', '').trim()),
    );

    const tokenIndex = Math.floor(Math.random() * eligableTokens.length + 0);
    const token = eligableTokens[tokenIndex];

    if (token == undefined) return;

    // Integration with polyglot
    if(polyglotIsActive){
      //@ts-ignore
      const polyglot:Polyglot = <Polyglot>window.polyglot.polyglot;
      const currentLanguageProvider:any = polyglot.LanguageProvider;
      // TODO get Languages from token
      const languagesTarget:string[] = [];
      // TODO get actors from current users usually just one
      const actors = [];
      // const languagesSource:Set<string> = polyglot.getUserLanguages(actors);
      const langNotKnow:string[] = [];
      languagesTarget.forEach((lang:string) =>{
        if (lang){
          const conditions = !polyglot._isTruespeech(lang) && !polyglot.known_languages.has(polyglot.comprehendLanguages) && !currentLanguageProvider.conditions(polyglot, lang);
          if (conditions) {
            // span.title = "????";
            // span.textContent = polyglot.scrambleString(span.textContent, journalSheet._id, lang);
            // span.style.font = polyglot._getFontStyle(lang);
            langNotKnow.push(lang);
          }
        }
      });
      if(langNotKnow && langNotKnow.length > 0){
        // I just get the first language not know from the actor
        const lang = langNotKnow[0];
        const eligableTablesPolyglot: RollTable[] = tables.filter((x: RollTable) =>
          npcTokens.filter((t: TokenDocument) =>
            x.name?.toLowerCase().includes(t.name?.toLowerCase().replace(' voice '+ lang, '').trim()),
          ),
        );

        const tableIndexPolyglot = Math.floor(Math.random() * eligableTablesPolyglot.length + 0);
        const tablePolyglot = eligableTablesPolyglot[tableIndexPolyglot];
        table = tablePolyglot;
      }
    }

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
