'use strict';

let indexTrack = 0;
const tracks = [{
	id: 1,
	src: './audio_data/1.mp3',
	title: 'Track #1'
}, {
	id: 2,
	src: './audio_data/2.mp3',
	title: 'Track #2'
}, {
	id: 3,
	src: './audio_data/3.mp3',
	title: 'Track #3'
}, {
	id: 4,
	src: './audio_data/4.mp3',
	title: 'Track #4'
}, {
	id: 5,
	src: './audio_data/5.mp3',
	title: 'Track #5'
}];

async function getCurrentTrack() {
	try {
		const currentTrack = await fetch('https://cors-test.appspot.com/test?current=1', {credentials: 'include'});

		return {
			...tracks[indexTrack], // currentTrack data
			status: {
				position: 0,
				duration: 0,
			},
			sm: {
				playingStatus: 'PAUSED',
			},
		};
	} catch (e) {
		console.error(e);

		return null;
	}
}

async function getNextTrack(postMessage) {
	try {
		const nextTrack = await fetch('https://cors-test.appspot.com/test?next=1', {credentials: 'include'});

		if (indexTrack === 4) {
			indexTrack = 0;
		} else {
			indexTrack += 1;
		}

		postMessage({type: 'w_next', data: tracks[indexTrack]}); // nextTrack

		return {
			...tracks[indexTrack],
		};
	} catch (e) {
		console.error(e);

		return null;
	}
}

async function init() {
	let interval;
	let currentTrack = null;
	let isEnded = false;

	// Init current track id
	currentTrack = await getCurrentTrack();
	await getNextTrack(self.postMessage);

	function getStatus() {
		interval = setTimeout(function () {
			self.postMessage({type: 'w_status'});
			getStatus();
		}, 500);
	}

	self.addEventListener('message', function (e) {
		switch (e.data.type) {
			case 'm_start': {
				const startEvent = async function () {
					self.postMessage({type: 'w_start', data: currentTrack});
				};

				clearInterval(interval);
				getStatus();
				startEvent();

				break;
			}

			case 'm_status': {
				const statusEvent = async function () {
					currentTrack.status = {
						position: e.data.position,
						duration: e.data.duration,
					};

					const deltaProgress = e.data.duration - currentTrack.status.position;
					if (!Number.isNaN(deltaProgress) && deltaProgress <= 1 && !isEnded) {
						isEnded = true;

						currentTrack = await getCurrentTrack();

						isEnded = false;

						self.postMessage({type: 'w_play', data: currentTrack});

						getNextTrack(self.postMessage); // for precache
					}
				};

				statusEvent();

				break;
			}

			case 'm_skip': {
				const skipEvent = async function () {
					currentTrack = await getCurrentTrack();
					self.postMessage({type: 'w_play', data: currentTrack});

					getNextTrack(self.postMessage); // for precache
				};

				skipEvent();

				break;
			}

			case 'm_pause': {
				self.postMessage({type: 'w_pause'});

				break;
			}

			case 'm_resume': {
				self.postMessage({type: 'w_resume'});

				break;
			}

			case 'm_stop':
				clearInterval(interval);

				break;
		}
	}, false);

	self.postMessage({type: 'w_init'});
}

init();
