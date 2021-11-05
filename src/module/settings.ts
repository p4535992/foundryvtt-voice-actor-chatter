import { i18n } from '../main';
import { getGame } from './helpers';

export const VOICE_ACTOR_CHATTER_MODULE_NAME = 'foundryvtt-voice-actor-chatter';

export const registerSettings = function () {

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'playersRecordOwned', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.players-record-owned.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.players-record-owned.hint'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'playersPlaybackLimited', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.players-playback-limited.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.players-playback-limited.hint'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'customDirectory', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.customDirectory.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.customDirectory.hint'),
    scope: 'world',
    config: true,
    default: `/worlds/${getGame().world.id}/${VOICE_ACTOR_CHATTER_MODULE_NAME}`,
    type: String,
    //@ts-ignore
    filePicker: 'audio',
    //@ts-ignore
    // type: SoundPicker.Sound, //audioTypeFunc,
  });

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'disableHeaderSheetButtons', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.disableHeaderSheetButtons.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.disableHeaderSheetButtons.hint'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'uploadFileUtil', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.uploadFileUtil.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.uploadFileUtil.hint'),
    scope: 'client',
    config: true,
    default: ``,
    type: String,
    //@ts-ignore
    filePicker: 'audio',
    //@ts-ignore
    // type: SoundPicker.Sound, //audioTypeFunc,
  });

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'integrationWithPolyglot', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.integrationWithPolyglot.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.integrationWithPolyglot.hint'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

  // TODO To developed

  getGame().settings.register(VOICE_ACTOR_CHATTER_MODULE_NAME, 'integrationWithNpcChatter', {
    name: i18n('foundryvtt-voice-actor-chatter.settings.integrationWithNpcChatter.name'),
    hint: i18n('foundryvtt-voice-actor-chatter.settings.integrationWithNpcChatter.hint'),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });

};
