import { log, warn } from '../main';
import { getCanvas, getGame } from './helpers';
import { VOICE_ACTOR_CHATTER_MODULE_NAME } from './settings';
import { onRender, VoiceActor } from './voiceactor';
import { VoiceActorChatter } from './voiceactorchatter';

const game = getGame();
const canvas = getCanvas();

export let polyglotIsActive;
export let npcChatterIsActive;

export const readyHooks = async () => {
  // setup all the hooks
  Hooks.on(`renderActorSheet`, onRender);

  Hooks.on(`renderJournalSheet`, onRender);

  if (game.user?.isGM) {
    // Will be used when custom dirs are supported
    const customDirectory = game.settings.get(VOICE_ACTOR_CHATTER_MODULE_NAME, 'customDirectory') ?? '';
    if (customDirectory) {
      // Ensure the VA dir exists
      try {
        await FilePicker.createDirectory(
          //@ts-ignore
          VoiceActor.isForge() ? 'forgevtt' : 'data',
          `${customDirectory}`,
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
          `${customDirectory}/Journal`,
        );
      } catch (e) {
        if (!String(e.message).startsWith('EEXIST')) {
          log(e);
        }
      }
    }
  }

  // Voice Chatter
  //@ts-ignore
  game.voiceActorChatter = new VoiceActorChatter();
  log('Is now ready');

  game.socket?.on(`module.${VOICE_ACTOR_CHATTER_MODULE_NAME}`, async (toShow) => {
    //log("Got token " + toShow.tokenId + " with text " + toShow.msg);
    const token = <Token>canvas.tokens?.get(toShow.tokenId);
    //console.log(token);
    // canvas.hud.bubbles.say(token, toShow.msg, false);
    VoiceActor.playClipRandomFromToken(token);
  });
};

export const setupHooks = () => {
  // DO NOTHING
};

export const initHooks = () => {
  warn('Init Hooks processing');
  polyglotIsActive =
    <boolean>game.modules.get('polyglot')?.active &&
    game.settings.get(VOICE_ACTOR_CHATTER_MODULE_NAME, 'integrationWithPolyglot');
  npcChatterIsActive =
    <boolean>game.modules.get('npc-chatter')?.active &&
    game.settings.get(VOICE_ACTOR_CHATTER_MODULE_NAME, 'integrationWithNpcChatter');
};
