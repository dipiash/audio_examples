class SM_Object {
	constructor() {
		this._audioTrackId = 'player_main';
	}

	/*************************************** Track part *******************/

	/**
	 * Init Worker
	 *
	 * @param {String} pathToWorker Path to worker script
	 * @param {Function} afterStartCallback Callback after worker init
	 * @param {Function} actionChangeCurrentTrack Change current track function
	 * @param {Function} actionChangeCurrentSoundStatus Change current track status playing
	 * @param {Function} actionChangeNextTrack Change next track data
	 *
	 * @return {void}
	 */
	startWorker(pathToWorker, {afterStartCallback, actionChangeCurrentTrack, actionChangeCurrentSoundStatus, actionChangeNextTrack}) {
		this._worker = new Worker(pathToWorker);
		this._worker.addEventListener('message', async e => {
			switch (e.data.type) {
				case 'w_init': {
					this._worker.postMessage({type: 'm_start'});

					break;
				}

				case 'w_start': {
					try {
						actionChangeCurrentTrack(e.data.data);
					} catch (e) {
						console.warn('You not implemented `actionChangeCurrentTrack`');
					}

					try {
						afterStartCallback();
					} catch (e) {
						console.warn('You not implemented `afterStartCallback`');
					}

					break;
				}

				case 'w_play': {
					try {
						actionChangeCurrentTrack(e.data.data);
					} catch (e) {
						console.warn('You not implemented `actionChangeCurrentTrack`');
					}

					try {
						actionChangeCurrentSoundStatus(e.data.data.id, 'PLAYING');
					} catch (e) {
						console.warn('You not implemented `actionChangeCurrentSoundStatus`');
					}

					await this.getSoundInstance().play();

					break;
				}

				case 'w_status': {
					const pl = this.getSoundInstance();

					if (pl && !pl.paused) {
						this._worker.postMessage({
							type: 'm_status',
							position: pl.currentTime,
							duration: pl.duration
						});
					}

					break;
				}

				case 'w_next': {
					actionChangeNextTrack(e.data.data);

					break;
				}
			}
		});
	}

	getSoundInstance() {
		return document.getElementById(this.getAudioTrackId());
	}

	/**
	 * Get worker instance
	 *
	 * @return {Worker} Worker
	 */
	getWorker() {
		return this._worker;
	}

	/**
	 * Get audio track id for html markup
	 * @return {string} String id
	 */
	getAudioTrackId() {
		return this._audioTrackId;
	}
}

const writeLog = text => {
	const newDiv = document.createElement('div');
	newDiv.style.color = 'red';
	newDiv.appendChild(document.createTextNode(text));
	document.body.appendChild(newDiv);
};

const SM_Object_Instance = new SM_Object();

const playF = async () => {
	SM_Object_Instance.getSoundInstance().play();
	writeLog('Трек запущен');
};

const pauseF =  async () => {
	await SM_Object_Instance.getSoundInstance().pause();
	writeLog('Трек на паузе');
};

const skipF = async () => {
	SM_Object_Instance.getWorker().postMessage({type: 'm_skip'});
	writeLog('Трек пропущен');

	await SM_Object_Instance.getSoundInstance().play();
};

const seekF = async () => {
	writeLog('Трек перемотан');

	audioC.currentTime = +audioC.duration - 10;
};

const audioC = document.getElementById('player_main');
const audioN = document.getElementById('player_precache');

SM_Object_Instance.startWorker('./audio_worker.js', {
	afterStartCallback: () => {
		writeLog('Воркер запущен');

		const player = SM_Object_Instance.getSoundInstance();

		if (player) {
			player.volume = 0.8;
		}
	},
	actionChangeCurrentTrack: data => {
		writeLog('Получены данные текущего трека ' + data.id);
		console.log('actionChangeCurrentTrack', data);

		audioC.src = data.src;
	},
	actionChangeCurrentSoundStatus: data => {
		writeLog('Получены данные состояния текущего трека ' + data);
		console.log('actionChangeCurrentSoundStatus', data);

	},
	actionChangeNextTrack: data => {
		writeLog('Получены данные следующего трека ' + data.id);
		console.log('actionChangeNextTrack', data);

		audioN.src = data.src;
	},
});
