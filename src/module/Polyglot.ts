export interface Polyglot {

  known_languages:Set<string>;
  literate_languages:Set<string>;
  refresh_timeout:number;

	get chatElement();

	/**
	 * Returns an object or array, based on the game system's own data structure.
	 *
	 * @returns {object|array}
	 */
	get languages():any|string[];

	/**
	 * @returns {String}
	 */
	get defaultLanguage():string;

	/**
	 * @returns {LanguageProvider}
	 */
	get LanguageProvider():any;

	/**
	 * @returns {String}
	 */
	get comprehendLanguages():string;

	/**
	 * @returns {String}
	 */
	get truespeech():string;

	/* -------------------------------------------- */
	/*  Hooks	                                    */
	/* -------------------------------------------- */

	/**
	 * Adds the Languages selector to the chatlog.
	 */
	renderChatLog(chatlog, html, data):void;

	/**
	 * Updates the languages in the Languages selector and the messages that are readable by the character.
	 */
	updateUser(user, data):void;

	controlToken():void;

	/**
	 * Updates the chat messages.
	 * It has a delay because switching tokens could cause a controlToken(false) then controlToken(true) very fast.
	 */
	updateChatMessages():void;

	/**
	 * Updates the last 100 messages. Loop in reverse so most recent messages get refreshed first.
	 */
	updateChatMessagesDelayed():void;

	getUserLanguages(actors:Actor[]):Set<string>[];

	/**
	 *
	 * @param {*} html
	 *
	 * @var {Set} this.known_languages
	 */
	updateUserLanguages(html):Set<string>;

	/**
	 * Generates a string using alphanumeric characters (0-9a-z)
	 * Use a seeded PRNG (pseudorandom number generator) to get consistent scrambled results.
	 *
	 * @param {string} string	The message's text.
	 * @param {string} salt		The message's id, if Randomize Runes setting is enabled (to make no two messages equal), or its language.
	 * @return {string}			The message's text with its characters scrambled by the PRNG.
	 */
	scrambleString(string:string, salt:string, lang:string):string;

	understands(lang:string):boolean;

	createChatMessage(chatEntity, _, userId):void;
	/**
	 * Renders the messages, scrambling the text if it is not known by the user (or currently selected character)
	 * and adding the indicators ("Translated From" text and the globe icon).
	 *
	 * @param {ChatMessage} message		The ChatMessage document being rendered
	 * @param {JQuery} html 			The pending HTML as a jQuery object
	 * @param {object} data 			The input data provided for template rendering
	 *
	 * @var {Boolean} known				Determines if the actor actually knows the language, rather than being affected by Comprehend Languages or Tongues
	 */
	renderChatMessage(message, html, data):Promise<void>;

	/**
	 * Adds the selected language to the message's flag.
	 * Since FVTT 0.8, it has to use Document#Update instead of Document#SetFlag because Document#SetFlag can't be called during the preCreate stage.
	 *
	 * @param {*} document
	 * @param {*} data
	 * @param {*} options
	 * @param {*} userId
	 */
	preCreateChatMessage(document, data, options, userId):void;

	/**
	 * Registers settings, adjusts the bubble dimensions so the message is displayed correctly,
	 * and loads the current languages set for Comprehend Languages Spells and Tongues Spell settings.
	 */
	ready():void;

	/**
	 * Register fonts so they are available to other elements (such as Drawings)
	 * First, remove all our fonts, then add them again if needed.
	 */
	updateConfigFonts():void;

	/**
	 * Renders a journal entry, scrambling the text of strings marked as under some language.
	 *
	 * @param {Document} journalSheet
	 * @param {*} html
	 * @returns
	 */
	renderJournalSheet(journalSheet, html):void;

	/**
	 * Renders a chat bubble, scrambling its text.
	 * It checks for emote.language in case a bubble is sent without a message (e.g. calling canvas.hud.bubbles.say()).
	 *
	 * @param {Token} token
	 * @param {*} html
	 * @param {*} messageContent
	 * @param {*} emote
	 */
	chatBubble(token, html, messageContent, { emote }):void;

	/**
	 * Scrambles the text of vino messages.
	 * @param {*} chatDisplayData
	 */
	vinoChatRender(chatDisplayData):void;

	/* -------------------------------------------- */
	/*  Internal Helpers	                        */
	/* -------------------------------------------- */

	/**
	 * Adds the Polyglot menu to the Journal's editor.
	 *
	 * @param {Document} sheet
	 * @returns
	 */
	_addPolyglotEditor(sheet):any;

	_allowOOC():boolean;

	/**
	 * Generates a hash based on the input string to be used as a seed.
	 *
	 * @author https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	 *
	 * @param {string} string 	The salted string.
	 * @returns {int}
	 */
	_hashCode(string:string):string

	/**
	 * Checks if a message is Out Of Character.
	 */
	_isMessageTypeOOC(type):boolean;

	/**
	 * Returns if the language is the target of the Tongues Spell setting.
	 *
	 * @param {string} lang
	 * @returns {Boolean}
	 */
	_isTruespeech(lang:string):string;

	_onGlobeClick(event):void;

	/**
	 *
	 * @param {string} lang 	A message's polyglot.language flag.
	 * @returns 				The alphabet of the lang or the default alphabet.
	 */
	_getFontStyle(lang:string):string;
}
