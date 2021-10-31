import { log, warn } from './main';
import { getCanvas, getGame, VOICE_ACTOR_MODULE_NAME } from './settings';
import { onRender, VoiceActor } from './voiceactor';
import { VoiceActorChatter } from './voiceactorchatter';

export const readyHooks = async () => {
  // setup all the hooks
  Hooks.on(`renderActorSheet`, onRender);

  Hooks.on(`renderJournalSheet`, onRender);

  if (getGame().user?.isGM) {
    // Will be used when custom dirs are supported
    const customDirectory = getGame().settings.get(VOICE_ACTOR_MODULE_NAME, 'customDirectory') ?? '';
    // Ensure the VA dir exists
    try {
      await FilePicker.createDirectory(
        //@ts-ignore
        VoiceActor.isForge() ? 'forgevtt' : 'data',
        `${customDirectory}/${VOICE_ACTOR_MODULE_NAME}}`,
      );
    } catch (e) {
      if (!String(e.message).startsWith('EEXIST')) {
        log(e);
      }
    }
    try {
      await FilePicker.createDirectory(
        //@ts-ignore
        VoiceActor.isForge() ? 'forgevtt' : 'data',
        `${customDirectory}/${VOICE_ACTOR_MODULE_NAME}/Journal`,
      );
    } catch (e) {
      if (!String(e.message).startsWith('EEXIST')) {
        log(e);
      }
    }
  }

  // Voice Chatter
  //@ts-ignore
  getGame().voiceActorChatter = new VoiceActorChatter();
  log('Is now ready');

  getGame().socket?.on(`module.${VOICE_ACTOR_MODULE_NAME}`, async (toShow) => {
    //log("Got token " + toShow.tokenId + " with text " + toShow.msg);
    const token = <Token>getCanvas().tokens?.get(toShow.tokenId);
    //console.log(token);
    // getCanvas().hud.bubbles.say(token, toShow.msg, false);
    VoiceActor.playClipRandomFromToken(token);
  });
};

export const setupHooks = () => {
  // DO NOTHING
};

export const initHooks = () => {
  warn('Init Hooks processing');
};
