import SoundPicker from "./libs/SoundPicker";

export const VOICE_ACTOR_MODULE_NAME = 'foundryvtt-voice-actor';

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getCanvas(): Canvas {
  if (!(canvas instanceof Canvas) || !canvas.ready) {
    throw new Error('Canvas Is Not Initialized');
  }
  return canvas;
}

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getGame(): Game {
  if (!(game instanceof Game)) {
    throw new Error('Game Is Not Initialized');
  }
  return game;
}

export const registerSettings = function () {
  getGame().settings.register('VoiceActor', 'playersRecordOwned', {
    name: 'VOICEACTOR.settings.players-record-owned.name',
    hint: 'VOICEACTOR.settings.players-record-owned.hint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  getGame().settings.register('VoiceActor', 'playersPlaybackLimited', {
    name: 'VOICEACTOR.settings.players-playback-limited.name',
    hint: 'VOICEACTOR.settings.players-playback-limited.hint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  getGame().settings.register('VoiceActor', 'customDirectory', {
    name: getGame().i18n.localize('VOICEACTOR.settings.customDirectory.name'),
    hint: getGame().i18n.localize('VOICEACTOR.settings.customDirectory.hint'),
    scope: 'world',
    config: true,
    default: '',
    // type: String,
    // filePicker: 'audio',
    //@ts-ignore
    type: SoundPicker.Sound, //audioTypeFunc,
  });
};
