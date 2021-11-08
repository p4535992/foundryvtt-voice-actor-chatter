import { getCanvas, getGame } from './helpers';
import { polyglotIsActive } from './Hooks';
import { Polyglot } from './Polyglot';
import { VOICE_ACTOR_CHATTER_MODULE_NAME } from './settings';
import { VoiceActor } from './voiceactor';

export class VoiceActorChatter {
  static timer;

  getVoiceChatterTables = function (token:Token|null) {
    let voiceActorFolder;
    if(token){
      voiceActorFolder = <Folder>(
        getGame().folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase() == token.name?.toLowerCase() + ' voice actor')[0]
      );
    }else{
      voiceActorFolder = <Folder>(
        getGame().folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase().endsWith(' voice actor'))[0]
      );
    }
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

  getVoiceChatterPolyglotTables = function (tokenName:string, lang: string) {
    const voiceActorFolder = <Folder>(
      getGame().folders?.contents.filter((x) => x.type == 'RollTable' && x.name?.toLowerCase() == tokenName?.toLowerCase() + ' voice actor')[0]
    );
    if (!voiceActorFolder) {
      ui.notifications?.error(
        `The '${VOICE_ACTOR_CHATTER_MODULE_NAME}' module requires a folder with name (case insensitive) 'voice actor' on the rollTable sidebar.`,
      );
      return [];
    }
    // const map:Map<string,RollTable[]> = new Map<string,RollTable[]>();
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
    const tables: RollTable[] = this.getVoiceChatterTables(null);

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
    if (polyglotIsActive) {
      await this._createAutomaticPolyglotRolltable([token], options);
      const tablePolyglot = this._checkRollTablePolyglot([token], options);
      if (tablePolyglot) {
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
    const tables: RollTable[] = this.getVoiceChatterTables(token);

    const eligableTables = tables.filter((x) =>
      token.name.toLowerCase().includes(<string>x.name?.toLowerCase().replace(' voice', '').trim()),
    );

    if (eligableTables.length == 0) return;

    const tableIndex = Math.floor(Math.random() * eligableTables.length + 0);
    let table: RollTable = eligableTables[tableIndex];

    // Integration with polyglot
    if (polyglotIsActive) {
      await this._createAutomaticPolyglotRolltable([token.document], options);
      const tablePolyglot = this._checkRollTablePolyglot([token.document], options);
      if (tablePolyglot) {
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
    // await getCanvas().hud.bubbles.say(token.data, result, emote);

    // Play Sounds File
    const toAll = options.toAll ?? false;
    VoiceActor.playClip(result, toAll);
  }

  async selectedChatter(options: any = {}) {
    const tables: RollTable[] = this.getVoiceChatterTables(null);

    const npcTokens = <Token[]>getCanvas().tokens?.controlled;

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
      await this._createAutomaticPolyglotRolltable([token.document], options);
      const tablePolyglot = this._checkRollTablePolyglot([token.document], options);
      if (tablePolyglot) {
        table = tablePolyglot;
      }
    }

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

  _checkRollTablePolyglot(npcTokens: TokenDocument[], options: any = {}): RollTable | null {
    //@ts-ignore
    const polyglot: Polyglot = <Polyglot>window.polyglot.polyglot;
    const currentLanguageProvider: any = polyglot.LanguageProvider;

    // Recover knowed languages of user
    const actorSource = <Actor>getGame().user?.character;
    const languagesSourceArray: Set<string>[] = polyglot.getUserLanguages([actorSource]);
    const languagesSource = new Set();
    for (const set of languagesSourceArray) {
      for (const element of set) {
        languagesSource.add(element);
      }
    }

    // get actors from current targets usually just one
    const actors: Actor[] = [];
    npcTokens.forEach((t: TokenDocument) => {
      if (t.actor) {
        actors.push(t.actor);
      }
    });

    // Recover knowed languages of target tokens
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
      const tables: RollTable[] = this.getVoiceChatterPolyglotTables(npcTokens[0].name,lang);
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

  async _createAutomaticPolyglotRolltable(npcTokens: TokenDocument[], options: any = {}): Promise<void> {
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

    // Recover knowed languages of target tokens
    const languagesTargetArray: Set<string>[] = polyglot.getUserLanguages(actors);
    const languagesTarget = new Set();
    for (const set of languagesTargetArray) {
      for (const element of set) {
        languagesTarget.add(element);
      }
    }

    if(languagesTarget.size > 0){
      const voiceActorFolder = getGame().folders?.contents.filter(
        (x: Folder) => x.type == 'RollTable' && x.name?.toLowerCase() == npcTokens[0].name + ' voice actor',
      )[0];
      await languagesTarget.forEach(async (lang: string) => {
        if (lang) {
          const actorPolyglotRollTableName = actors[0]?.name + ' voice ' + lang;
          let myTable: RollTable | undefined = getGame().tables?.contents.find(
            (table: RollTable) => table.name?.toLowerCase() == actorPolyglotRollTableName.toLowerCase(),
          );
          if (!myTable) {
            const formula = '1d20';
            const min = 1;
            const max = 20;
            myTable = <RollTable>await RollTable.create({
              name: actorPolyglotRollTableName,
              // description: actorRollTableName, // This appears on every roll in the chat!
              results: [],
              replacement: true,
              displayRoll: true,
              img: 'icons/svg/sound.svg', //"modules/EasyTable/easytable.png"
              folder: voiceActorFolder ? voiceActorFolder : '',
              formula: formula ? formula : min == 1 ? `1d${max}` : `1d${max - min + 1}+${min - 1}`,
              //sort: number,
              //permission: object,
              //flags: object
            });
            //@ts-ignore
            await myTable.normalize();
          }
        }
      });
    }
  }
}
