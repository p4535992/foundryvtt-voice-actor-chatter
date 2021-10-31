/**
 * VoiceActor by Blitz
 */

import { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { BaseTableResult } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { getGame, VOICE_ACTOR_MODULE_NAME } from './settings';
import { VoiceActorChatter } from './voiceactorchatter';

export class VoiceActor {
  static moduleName = VOICE_ACTOR_MODULE_NAME;

  static getClipFromRollTableRow = async (data:TokenData, customDirectory:string, textResult:string, isJournal:boolean) => {
    if (!customDirectory) {
      customDirectory = <string>getGame().settings.get(VOICE_ACTOR_MODULE_NAME, 'customDirectory') ?? '';
    }

    const nameActorFolder = VoiceActor.getClipActorFolderName(data);
    // Get files
    const vaDir = await FilePicker.browse(
      //@ts-ignore
      VoiceActor.isForge() ? 'forgevtt' : 'data',
      `${customDirectory}/VoiceActor${isJournal ? '/Journal' : ''}/${nameActorFolder}`,
    );
    // Check if file exists already
    const fileName = textResult;
    return VoiceActor.getFile(vaDir.files, fileName);
  };

  static getClip = async (data, customDirectory, isJournal) => {
    if (!customDirectory) {
      customDirectory = getGame().settings.get(VOICE_ACTOR_MODULE_NAME, 'customDirectory') ?? '';
    }

    const nameActorFolder = VoiceActor.getClipActorFolderName(data);

    // Get files
    const vaDir = await FilePicker.browse(
      //@ts-ignore
      VoiceActor.isForge() ? 'forgevtt' : 'data',
      `${customDirectory}/VoiceActor${isJournal ? '/Journal' : ''}/${nameActorFolder}`,
    );
    // Check if file exists already
    const fileName = VoiceActor.getClipActorFileName(data, isJournal);

    return VoiceActor.getFile(vaDir.files, fileName);
  };

  static getClipActorFolderName = function (data) {
    const fileName = `${data.actor._id}-${data.actor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    return fileName;
  };

  static getClipActorFileName = function (data, isJournal) {
    // Check if file exists already
    let fileName;
    if (isJournal) {
      fileName = `${data.entity._id}.wav`;
    } else {
      if (data.actor.token.actorLink) {
        fileName = `${data.actor._id}.wav`;
      } else {
        fileName = `${data.actor._id}-${data.actor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
      }
    }
    return fileName;
  };

  static getFile = (filesArray, filename) => {
    const file = filesArray.find((el) => el.includes(filename));
    return file || false;
  };

  static isForge = () => {
    //@ts-ignore
    if (typeof ForgeVTT !== 'undefined') {
      //@ts-ignore
      return ForgeVTT.usingTheForge;
    } else {
      return false;
    }
  };

  static playClip = async function (clip, toAllWithSocket) {
    // let playVolume = getGame().settings.get("core", "globalInterfaceVolume"); // TODO CUSTOMIZE WITH MODULE SETTINGS ???
    // AudioHelper.play({src: fileClipPlayPath, volume: playVolume, autoplay: true, loop: false}, true);
    // Audio file to be played back
    let vaPlaybackFile;
    //@ts-ignore
    const hasHowler = typeof Howl != 'undefined';
    if (clip) {
      // Used for onend and onstop
      const onFinish = (id) => {
        // Prevent caching, in case the user overwrites the clip
        if (vaPlaybackFile) {
          if (hasHowler) {
            vaPlaybackFile.unload();
          }
          vaPlaybackFile = undefined;
        }
        // vaStates.playing = false;
        // title.find("#voiceactor-playback #voiceactor-playback-icon").removeClass('fa-stop').addClass('fa-play');
      };
      // Play file
      const payload = {
        src: clip,
        volume: getGame().settings.get('core', 'globalInterfaceVolume'), // TODO CUSTOMIZE WITH MODULE SETTINGS ???
        onend: onFinish,
        onstop: onFinish,
      };
      if (hasHowler) {
        //@ts-ignore
        vaPlaybackFile = new Howl(payload);
        vaPlaybackFile.play();
      } else {
        //@ts-ignore
        vaPlaybackFile = new Sound(payload.src);
        vaPlaybackFile.on('end', onFinish);
        vaPlaybackFile.on('stop', onFinish);
        await vaPlaybackFile.load();
        vaPlaybackFile.play({ volume: payload.volume });
      }
      // vaStates.playing = true;
      // title.find("#voiceactor-playback #voiceactor-playback-icon").removeClass('fa-play').addClass('fa-stop');
      if (toAllWithSocket) {
        getGame().socket?.emit('playAudio', payload);
        ui.notifications?.notify(getGame().i18n.localize('VOICEACTOR.notif.broadcasted'));
      }
    } else {
      ui.notifications?.notify(getGame().i18n.localize('VOICEACTOR.notif.no-clip-for-actor'));
    }
  };

  static retrieveOrCreateRollTable = async function (tokenData: TokenData, fileNamePath: string, fileName: string) {
    const voiceActorFolder = getGame().folders?.contents.filter(
      (x: Folder) => x.type == 'RollTable' && x.name?.toLowerCase() == 'voice actor',
    )[0];
    const actorRollTableName = tokenData.actorData?.name + ' voice';
    let myTable: RollTable | undefined = getGame().tables?.contents.find(
      (table: RollTable) => table.name?.toLowerCase() == actorRollTableName.toLowerCase(),
    );
    if (!myTable) {
      // ui.notifications.notify(getGame().i18n.format("VOICEACTOR.notif.no-rolltable-for-actor", actorRollTableName));
      myTable = <RollTable>await RollTable.create({
        name: actorRollTableName,
        // description: actorRollTableName, // This appears on every roll in the chat!
        results: [],
        replacement: true,
        displayRoll: true,
        img: '', //"modules/EasyTable/easytable.png"
        folder: voiceActorFolder ? voiceActorFolder : '',
        // formula:     formula ? formula : (min == 1) ? `1d${max}` : `1d${max-min+1}+${min-1}`,
        //sort: number,
        //permission: object,
        //flags: object
      });
      //@ts-ignore
      await myTable.normalize();
    }

    VoiceActor._onCreateResult(myTable, fileName);
  };

  static async _onCreateResult(rollTable: RollTable, fileName: string) {
    // event.preventDefault();

    // Save any pending changes
    // await this._onSubmit(event);

    // Get existing results
    //@ts-ignore
    const results: any[] = Array.from(rollTable.document.results.values());
    const last = results[results.length - 1];

    // Get weight and range data
    const weight = last ? last.data.weight || 1 : 1;
    const totalWeight = <number>results.reduce((t: any, r: any) => t + r.data.weight, 0) || 1;
    const minRoll = results.length ? Math.min(...results.map((r: any) => r.data.range[0])) : 0;
    const maxRoll = results.length ? Math.max(...results.map((r: any) => r.data.range[1])) : 0;

    // Determine new starting range
    const spread = maxRoll - minRoll + 1;
    const perW = Math.round(spread / totalWeight);
    const range = [maxRoll + 1, maxRoll + Math.max(1, weight * perW)];

    // Create the new Result
    const resultData: any = {
      label: fileName,
      type: last ? last.type : CONST.TABLE_RESULT_TYPES.TEXT,
      collection: last ? last.collection : null,
      weight: weight,
      range: range,
      drawn: false,
    };
    //@ts-ignore
    return rollTable.document?.createEmbeddedDocuments('TableResult', [resultData]);
  }

  // static getCollection(collection) {
  //   let validCollection = ['Actor', 'Scene', 'Macro', 'Playlist', 'JournalEntry', 'RollTable', 'Item']
  //   if (validCollection.includes(collection)) {
  //       return collection
  //   }
  //   return '';
  // }

  // static getResultId(collection, text) {
  //     let resultId = '';
  //     let img = 'icons/svg/d20-black.svg'
  //     if (collection == 'Text' || !collection) {
  //         return [resultId, img];
  //     }
  //     let entity;
  //     switch (collection) {
  //         case 'Actor':
  //                 entity = getGame().actors.getName(text);
  //                 resultId = entity?.id||''
  //                 img = entity?.img||img;
  //             break;
  //         case 'Scene':
  //                 entity = getGame().scenes.getName(text);
  //                 resultId = entity?.id||''
  //                 img = entity?.img||img;
  //             break;
  //         case 'Macro':
  //                 entity = getGame().macros.getName(text);
  //                 resultId = entity?.id||''
  //                 img = entity?.data?.img||img;
  //             break;
  //         case 'Playlist':
  //                 entity = getGame().playlists.getName(text);
  //                 resultId = entity?.id||''
  //                 // img = entity?.img||img;
  //             break;
  //         case 'JournalEntry':
  //                 entity = getGame().journal.getName(text);
  //                 resultId = entity?.id||''
  //                 img = entity?.data?.img||img;
  //             break;
  //         case 'RollTable':
  //                 entity = getGame().tables.getName(text);
  //                 resultId = entity?.id||''
  //                 img = entity?.data?.img||img;
  //             break;
  //         case 'Item':
  //                 entity = getGame().items.getName(text);
  //                 resultId = entity?.id||''
  //                 img = entity?.img||img;
  //             break;
  //         default:
  //             break;
  //     }
  //     return [resultId, img];
  // }
}

export const readyHooks = async () => {
  if (getGame().user?.isGM) {
    // Will be used when custom dirs are supported
    const customDirectory = getGame().settings.get(VOICE_ACTOR_MODULE_NAME, 'customDirectory') ?? '';
    // Ensure the VA dir exists
    try {
      //@ts-ignore
      await FilePicker.createDirectory(VoiceActor.isForge() ? 'forgevtt' : 'data', `${customDirectory}/VoiceActor}`);
    } catch (e) {
      if (!e.startsWith('EEXIST')) {
        console.log(e);
      }
    }
    try {
      await FilePicker.createDirectory(
        //@ts-ignore
        VoiceActor.isForge() ? 'forgevtt' : 'data',
        `${customDirectory}/VoiceActor/Journal`,
      );
    } catch (e) {
      if (!e.startsWith('EEXIST')) {
        console.log(e);
      }
    }
  }
};

const onRender = async (app, html, data) => {
  const customDirectory = getGame().settings.get(VOICE_ACTOR_MODULE_NAME, 'customDirectory') ?? '';

  // Get window-title from html so we can prepend our buttons
  const title = html.find('.window-title');

  // Store recording and playback states
  const vaStates = {
    recording: false,
    playing: false,
  };

  // Audio file to be played back
  let vaPlaybackFile;

  // MediaRecorder
  let vaRecorder;

  // timeout to sop vaRecorder after 10 seconds if not stopped manually
  let vaRecorderTimeout;

  let isJournal = false;
  if (data.options.classes.indexOf('journal-sheet') > -1) {
    isJournal = true;
  }

  let buttons = ``;

  if (
    getGame().user?.isGM ||
    (data.owner &&
      getGame().settings?.get(VOICE_ACTOR_MODULE_NAME, 'playersRecordOwned') &&
      getGame().user?.hasPermission('FILES_UPLOAD'))
  ) {
    buttons += `<button id="voiceactor-record" class="voiceactor-button" title="${getGame().i18n.localize(
      'VOICEACTOR.ui.button-tooltip-record',
    )}">
        <i id="voiceactor-record-icon" style="color: white" class="fas fa-microphone"></i>
        </button>`;
  }

  if (getGame().user?.isGM || data.owner || getGame().settings.get(VOICE_ACTOR_MODULE_NAME, 'playersPlaybackLimited')) {
    buttons += `<button id="voiceactor-playback" class="voiceactor-button" title="${getGame().i18n.localize(
      'VOICEACTOR.ui.button-tooltip-playback',
    )}">
        <i id="voiceactor-playback-icon" style="color: white" class="fas fa-play"></i>
        </button>`;
  }

  // Add buttons
  title.prepend(buttons);

  const clip = await VoiceActor.getClip(data, customDirectory, isJournal);

  if (clip) {
    // Change button color if this actor has a clip already
    title.find('#voiceactor-record #voiceactor-record-icon').css('color', 'lightgreen');
  }

  title.find('#voiceactor-record').click(async (ev) => {
    if (vaStates.recording) {
      // Stop recording if button is pressed while recording active
      vaRecorder.stop();
      return;
    }

    const clip = await VoiceActor.getClip(data, customDirectory, isJournal);

    if (clip) {
      if (!ev.shiftKey) {
        // Notify user if record is clicked but clip exists. Bypass if SHIFT is held when clicking.
        ui.notifications?.notify(getGame().i18n.localize('VOICEACTOR.notif.clip-exists'));
        return;
      } else {
        if (VoiceActor.isForge()) {
          ui.notifications?.notify(getGame().i18n.localize('VOICEACTOR.notif.forge-cache'));
        }
      }
    }

    const fileName = VoiceActor.getClipActorFileName(data, isJournal);

    if (!navigator.mediaDevices) {
      ui.notifications?.error(getGame().i18n.localize('VOICEACTOR.notif.no-media-devices'));
    }
    // Record clip
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then(async (stream) => {
        vaStates.recording = true;
        title.find('#voiceactor-record #voiceactor-record-icon').removeClass('fa-microphone').addClass('fa-stop');
        title.find('#voiceactor-record #voiceactor-record-icon').css('color', 'red');
        const chunks: any[] = [];
        vaRecorder = new MediaRecorder(stream);
        vaRecorder.ondataavailable = async (e: any) => {
          chunks.push(e.data);
          if (vaRecorder.state == 'inactive') {
            const blob = new Blob(chunks, {
              type: 'audio/wav',
            });
            const file = new File([blob], fileName, {
              type: 'audio/wav',
            });

            const nameActorFolder = VoiceActor.getClipActorFolderName(data);
            const dirName = `${customDirectory}/VoiceActor${isJournal ? '/Journal' : ''}/${nameActorFolder}`;
            //@ts-ignore
            await FilePicker.upload(VoiceActor.isForge() ? 'forgevtt' : 'data', dirName, file);
            vaStates.recording = false;

            // Only really works with Firefox, chrome has some weird caching, requiring the user to wait about 30 seconds
            //@ts-ignore
            getGame().audio?.buffers.delete(`${dirName[0] == '/' ? dirName.substr(1) : dirName}/${fileName}`);

            title.find('#voiceactor-record #voiceactor-record-icon').removeClass('fa-stop').addClass('fa-microphone');
            title.find('#voiceactor-record #voiceactor-record-icon').css('color', 'lightgreen');
            vaRecorder = null; //delete vaRecorder;
            clearTimeout(vaRecorderTimeout);
            vaRecorderTimeout = null; //delete vaRecorderTimeout;
            // stream = null; //delete stream;

            VoiceActor.retrieveOrCreateRollTable(
              data,
              `${dirName[0] == '/' ? dirName.substr(1) : dirName}/${fileName}`,
              fileName,
            );
          }
        };
        vaRecorder.start();
        // Stop recording after 30 seconds. Timeout is cancelled if user stops manually
        vaRecorderTimeout = setTimeout(() => {
          vaRecorder.stop();
        }, 30000);
      })
      .catch((e) => {
        console.log(e);
      });
  });

  title.find('#voiceactor-playback').click(async (ev: any) => {
    if (vaStates.playing) {
      // Stop playback if pressed while playing
      vaPlaybackFile.stop();
      vaStates.playing = false;
      return;
    }

    const clip = await VoiceActor.getClip(data, customDirectory, isJournal);
    //@ts-ignore
    const hasHowler = typeof Howl != 'undefined';
    if (clip) {
      // Used for onend and onstop
      const onFinish = (id) => {
        // Prevent caching, in case the user overwrites the clip
        if (vaPlaybackFile) {
          if (hasHowler) {
            vaPlaybackFile.unload();
          }
          vaPlaybackFile = undefined;
        }
        vaStates.playing = false;
        title.find('#voiceactor-playback #voiceactor-playback-icon').removeClass('fa-stop').addClass('fa-play');
      };
      // Play file
      const payload = {
        src: clip,
        volume: getGame().settings.get('core', 'globalInterfaceVolume'), // TODO CUSTOMIZE WITH MODULE SETTINGS ???
        onend: onFinish,
        onstop: onFinish,
      };
      if (hasHowler) {
        //@ts-ignore
        vaPlaybackFile = new Howl(payload);
        vaPlaybackFile.play();
      } else {
        //@ts-ignore
        vaPlaybackFile = new Sound(payload.src);
        vaPlaybackFile.on('end', onFinish);
        vaPlaybackFile.on('stop', onFinish);
        await vaPlaybackFile.load();
        vaPlaybackFile.play({ volume: payload.volume });
      }
      vaStates.playing = true;
      title.find('#voiceactor-playback #voiceactor-playback-icon').removeClass('fa-play').addClass('fa-stop');
      if (ev.shiftKey) {
        getGame().socket?.emit('playAudio', payload);
        ui.notifications?.notify(getGame().i18n.localize('VOICEACTOR.notif.broadcasted'));
      }
    } else {
      ui.notifications?.notify(getGame().i18n.localize('VOICEACTOR.notif.no-clip-for-actor'));
    }
  });
};

Hooks.on(`renderActorSheet`, onRender);

Hooks.on(`renderJournalSheet`, onRender);
