/**
 * VoiceActor by Blitz
 */

import { VoiceActorChatter } from "./voiceactorchatter";

export class VoiceActor {
    static moduleName = "VoiceActor";

    static getClipFromRollTableRow = async (data, customDirectory, textResult) => {
        if(!customDirectory){
          customDirectory = game.settings.get("VoiceActor", "customDirectory") ?? '';
        }

        let nameActorFolder = VoiceActor.getClipActorFolderName(data);
        // Get files
        let vaDir = await FilePicker.browse(VoiceActor.isForge() ? 'forgevtt' : 'data', `${customDirectory}/VoiceActor${isJournal?'/Journal':''}/${nameActorFolder}`)
        // Check if file exists already
        let fileName = textResult;
        return VoiceActor.getFile(vaDir.files, fileName);
    }

    static getClip = async (data, customDirectory, isJournal) => {
        if(!customDirectory){
          customDirectory = game.settings.get("VoiceActor", "customDirectory") ?? '';
        }
        // Get files
        let vaDir = await FilePicker.browse(VoiceActor.isForge() ? 'forgevtt' : 'data', `${customDirectory}/VoiceActor${isJournal?'/Journal':''}/${nameActorFolder}`)
        // Check if file exists already
        let fileName = VoiceActor.getClipActorFileName(data, isJournal);

        return VoiceActor.getFile(vaDir.files, fileName);
    }

    static getClipActorFolderName = function(data){
      let fileName = `${data.actor._id}-${data.actor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
      return fileName;
    }

    static getClipActorFileName = function(data, isJournal){
      // Check if file exists already
      let fileName;
      if (isJournal) {
          fileName = `${data.entity._id}.wav`;
      } else {
          if (data.actor.token.actorLink) {
              fileName = `${data.actor._id}.wav`;
          } else {
              fileName = `${data.actor._id}-${data.actor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`
          }
      }
      return fileName;
    }

    static getFile = (filesArray, filename) => {
        let file = filesArray.find(el => el.includes(filename))
        return file || false;
    }

    static isForge = () => {
        if (typeof ForgeVTT !== 'undefined') {
            return ForgeVTT.usingTheForge;
        } else {
            return false;
        }
    }

    static playClip(clip, toAllWithSocket){
      // let playVolume = game.settings.get("core", "globalInterfaceVolume"); // TODO CUSTOMIZE WITH MODULE SETTINGS ???
      // AudioHelper.play({src: fileClipPlayPath, volume: playVolume, autoplay: true, loop: false}, true);
      // Audio file to be played back
      let vaPlaybackFile;
      let hasHowler = typeof Howl != 'undefined'
      if (clip) {
          // Used for onend and onstop
          let onFinish = (id) => {
              // Prevent caching, in case the user overwrites the clip
              if (vaPlaybackFile) {
                  if(hasHowler){
                      vaPlaybackFile.unload();
                  }
                  vaPlaybackFile = undefined;
              }
              // vaStates.playing = false;
              // title.find("#voiceactor-playback #voiceactor-playback-icon").removeClass('fa-stop').addClass('fa-play');
          }
          // Play file
          let payload = {
              src: clip,
              volume: game.settings.get("core", "globalInterfaceVolume"), // TODO CUSTOMIZE WITH MODULE SETTINGS ???
              onend: onFinish,
              onstop: onFinish
          }
          if(hasHowler){
              vaPlaybackFile = new Howl(payload);
              vaPlaybackFile.play();
          } else {
              vaPlaybackFile = new Sound(payload.src);
              vaPlaybackFile.on('end', onFinish);
              vaPlaybackFile.on('stop', onFinish)
              await vaPlaybackFile.load();
              vaPlaybackFile.play({volume: payload.volume});
          }
          // vaStates.playing = true;
          // title.find("#voiceactor-playback #voiceactor-playback-icon").removeClass('fa-play').addClass('fa-stop');
          if (toAllWithSocket) {
              game.socket.emit("playAudio", payload)
              ui.notifications.notify(game.i18n.localize("VOICEACTOR.notif.broadcasted"));
          }


      } else {
          ui.notifications.notify(game.i18n.localize("VOICEACTOR.notif.no-clip-for-actor"));
      }
    }

    static retrieveOrCreateRollTable(tokenData, fileNamePath){
      const voiceActorFolder = game.folders.contents.filter(x => x.type == "RollTable" && x.name.toLowerCase() == "voice actor")[0];
      let actorRollTableName = tokenData.actor.name + " voice";
      let myTable = game.tables.entities.find(table => table.name.toLowerCase() == actorRollTableName.toLowerCase());
      if(!myTable){
        // ui.notifications.notify(game.i18n.format("VOICEACTOR.notif.no-rolltable-for-actor", actorRollTableName));
        myTable = await RollTable.create({
            name: actorRollTableName,
            // description: actorRollTableName, // This appears on every roll in the chat!
            results: [],
            replacement: true,
            displayRoll: true,
            img: '', //"modules/EasyTable/easytable.png"
            folder: voiceActorFolder ? voiceActorFolder : ''
            // formula:     formula ? formula : (min == 1) ? `1d${max}` : `1d${max-min+1}+${min-1}`,
            //sort: number,
            //permission: object,
            //flags: object
        });
        await myTable.normalize();
    }

      // TODO code for add a element ot the rolltable
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
    //                 entity = game.actors.getName(text);
    //                 resultId = entity?.id||''
    //                 img = entity?.img||img;
    //             break;
    //         case 'Scene':
    //                 entity = game.scenes.getName(text);
    //                 resultId = entity?.id||''
    //                 img = entity?.img||img;
    //             break;
    //         case 'Macro':
    //                 entity = game.macros.getName(text);
    //                 resultId = entity?.id||''
    //                 img = entity?.data?.img||img;
    //             break;
    //         case 'Playlist':
    //                 entity = game.playlists.getName(text);
    //                 resultId = entity?.id||''
    //                 // img = entity?.img||img;
    //             break;
    //         case 'JournalEntry':
    //                 entity = game.journal.getName(text);
    //                 resultId = entity?.id||''
    //                 img = entity?.data?.img||img;
    //             break;
    //         case 'RollTable':
    //                 entity = game.tables.getName(text);
    //                 resultId = entity?.id||''
    //                 img = entity?.data?.img||img;
    //             break;
    //         case 'Item':
    //                 entity = game.items.getName(text);
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

    game.settings.register("VoiceActor", "playersRecordOwned", {
        name: "VOICEACTOR.settings.players-record-owned.name",
        hint: "VOICEACTOR.settings.players-record-owned.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("VoiceActor", "playersPlaybackLimited", {
        name: "VOICEACTOR.settings.players-playback-limited.name",
        hint: "VOICEACTOR.settings.players-playback-limited.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("VoiceActor", "customDirectory", {
        name: game.i18n.localize("VOICEACTOR.settings.customDirectory.name"),
        hint: game.i18n.localize("VOICEACTOR.settings.customDirectory.hint"),
        scope: "world",
        config: true,
        type: String,
        default: "",
        filePicker: "audio",
    });

    if (game.user.isGM) {
        // Will be used when custom dirs are supported
        let customDirectory = game.settings.get("VoiceActor", "customDirectory") ?? '';
        // Ensure the VA dir exists
        try {
            await FilePicker.createDirectory(VoiceActor.isForge() ? 'forgevtt' : 'data', `${customDirectory}/VoiceActor}`)
        } catch (e) {
            if (!e.startsWith('EEXIST')) {
                console.log(e);
            }
        }
        try {
            await FilePicker.createDirectory(VoiceActor.isForge() ? 'forgevtt' : 'data', `${customDirectory}/VoiceActor/Journal`)
        } catch (e) {
            if (!e.startsWith('EEXIST')) {
                console.log(e);
            }
        }
    }
};

let onRender = async (app, html, data) => {

    let customDirectory = game.settings.get("VoiceActor", "customDirectory") ?? '';

    // Get window-title from html so we can prepend our buttons
    let title = html.find('.window-title');

    // Store recording and playback states
    let vaStates = {
        recording: false,
        playing: false
    }

    // Audio file to be played back
    let vaPlaybackFile;

    // MediaRecorder
    let vaRecorder;

    // timeout to sop vaRecorder after 10 seconds if not stopped manually
    let vaRecorderTimeout;

    let isJournal = false;
    if (data.options.classes.indexOf("journal-sheet") > -1) {
        isJournal = true;
    }

    let buttons = ``;

    if (game.user.isGM || (data.owner && game.settings.get("VoiceActor", "playersRecordOwned") && game.user.hasPermission("FILES_UPLOAD"))) {
        buttons += `<button id="voiceactor-record" class="voiceactor-button" title="${game.i18n.localize("VOICEACTOR.ui.button-tooltip-record")}">
        <i id="voiceactor-record-icon" style="color: white" class="fas fa-microphone"></i>
        </button>`;
    }

    if (game.user.isGM || data.owner || game.settings.get("VoiceActor", "playersPlaybackLimited")) {
        buttons += `<button id="voiceactor-playback" class="voiceactor-button" title="${game.i18n.localize("VOICEACTOR.ui.button-tooltip-playback")}">
        <i id="voiceactor-playback-icon" style="color: white" class="fas fa-play"></i>
        </button>`
    }

    // Add buttons
    title.prepend(buttons);

    let clip = await VoiceActor.getClip(data, customDirectory, isJournal);

    if (clip) {
        // Change button color if this actor has a clip already
        title.find("#voiceactor-record #voiceactor-record-icon").css('color', 'lightgreen');
    }

    title.find("#voiceactor-record").click(async (ev) => {

        if (vaStates.recording) {
            // Stop recording if button is pressed while recording active
            vaRecorder.stop();
            return;
        }

        let clip = await VoiceActor.getClip(data, customDirectory, isJournal);

        if (clip) {
            if (!ev.shiftKey) {
                // Notify user if record is clicked but clip exists. Bypass if SHIFT is held when clicking.
                ui.notifications.notify(game.i18n.localize("VOICEACTOR.notif.clip-exists"));
                return;
            } else {
                if (VoiceActor.isForge()) {
                    ui.notifications.notify(game.i18n.localize("VOICEACTOR.notif.forge-cache"))
                }
            }
        }

        let fileName = VoiceActor.getClipActorFileName(data, isJournal);

        if(!navigator.mediaDevices){
            ui.notifications.error(game.i18n.localize("VOICEACTOR.notif.no-media-devices"));
        }
        // Record clip
        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(async stream => {
            vaStates.recording = true;
            title.find("#voiceactor-record #voiceactor-record-icon").removeClass('fa-microphone').addClass('fa-stop');
            title.find("#voiceactor-record #voiceactor-record-icon").css('color', 'red');
            const chunks = [];
            vaRecorder = new MediaRecorder(stream);
            vaRecorder.ondataavailable = async e => {
                chunks.push(e.data);
                if (vaRecorder.state == 'inactive') {
                    const blob = new Blob(chunks, {
                        type: 'audio/wav'
                    });
                    const file = new File([blob], fileName, {
                        type: 'audio/wav'
                    })

                    let nameActorFolder = VoiceActor.getClipActorFolderName(data);
                    let dirName = `${customDirectory}/VoiceActor${isJournal?'/Journal':''}/${nameActorFolder}`;

                    await FilePicker.upload(VoiceActor.isForge() ? 'forgevtt' : 'data', dirName, file);
                    vaStates.recording = false;

                    // Only really works with Firefox, chrome has some weird caching, requiring the user to wait about 30 seconds
                    game.audio.buffers.delete(`${dirName[0]=='/'?dirName.substr(1):dirName}/${fileName}`);

                    title.find("#voiceactor-record #voiceactor-record-icon").removeClass('fa-stop').addClass('fa-microphone');
                    title.find("#voiceactor-record #voiceactor-record-icon").css('color', 'lightgreen');
                    delete vaRecorder;
                    clearTimeout(vaRecorderTimeout);
                    delete vaRecorderTimeout;
                    delete stream;

                    VoiceActor.retrieveOrCreateRollTable(data,`${dirName[0]=='/'?dirName.substr(1):dirName}/${fileName}`);
                }
            };
            vaRecorder.start();
            // Stop recording after 30 seconds. Timeout is cancelled if user stops manually
            vaRecorderTimeout = setTimeout(() => {
                vaRecorder.stop();
            }, 30000);
        }).catch((e)=>{
            console.log(e);
        });
    });

    title.find("#voiceactor-playback").click(async (ev) => {
        if (vaStates.playing) {
            // Stop playback if pressed while playing
            vaPlaybackFile.stop();
            vaStates.playing = false;
            return;
        }

        let clip = await VoiceActor.getClip(data, customDirectory, isJournal);

        let hasHowler = typeof Howl != 'undefined'
        if (clip) {
            // Used for onend and onstop
            let onFinish = (id) => {
                // Prevent caching, in case the user overwrites the clip
                if (vaPlaybackFile) {
                    if(hasHowler){
                        vaPlaybackFile.unload();
                    }
                    vaPlaybackFile = undefined;
                }
                vaStates.playing = false;
                title.find("#voiceactor-playback #voiceactor-playback-icon").removeClass('fa-stop').addClass('fa-play');
            }
            // Play file
            let payload = {
                src: clip,
                volume: game.settings.get("core", "globalInterfaceVolume"), // TODO CUSTOMIZE WITH MODULE SETTINGS ???
                onend: onFinish,
                onstop: onFinish
            }
            if(hasHowler){
                vaPlaybackFile = new Howl(payload);
                vaPlaybackFile.play();
            } else {
                vaPlaybackFile = new Sound(payload.src);
                vaPlaybackFile.on('end', onFinish);
                vaPlaybackFile.on('stop', onFinish)
                await vaPlaybackFile.load();
                vaPlaybackFile.play({volume: payload.volume});
            }
            vaStates.playing = true;
            title.find("#voiceactor-playback #voiceactor-playback-icon").removeClass('fa-play').addClass('fa-stop');
            if (ev.shiftKey) {
                game.socket.emit("playAudio", payload)
                ui.notifications.notify(game.i18n.localize("VOICEACTOR.notif.broadcasted"));
            }


        } else {
            ui.notifications.notify(game.i18n.localize("VOICEACTOR.notif.no-clip-for-actor"));
        }
    });
};

Hooks.on(`renderActorSheet`, onRender);

Hooks.on(`renderJournalSheet`, onRender);

