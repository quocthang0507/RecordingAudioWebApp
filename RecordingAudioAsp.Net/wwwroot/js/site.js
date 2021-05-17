/*jshint esversion: 6 */

let audio_context;
let recorder1, recorder2;

function showLog(e, data, i) {
	if (i == 1)
		log1.innerHTML += "\n" + e + " " + (data || '');
	else if (i == 2)
		log2.innerHTML += "\n" + e + " " + (data || '');
	else {
		log1.innerHTML += "\n" + e + " " + (data || '');
		log2.innerHTML += "\n" + e + " " + (data || '');
	}
}

function startUserMedia(stream) {
	let input1 = audio_context.createMediaStreamSource(stream);
	let input2 = audio_context.createMediaStreamSource(stream);
	showLog('Media stream created.');

	recorder1 = new Recorder(input1);
	recorder2 = new Recorder(input2);
	showLog('Recorder initialised.');
}

function startRecording(button, i) {
	if (i == 1) {
		recorder1 && recorder1.record();
	} else {
		recorder2 && recorder2.record();
	}
	button.disabled = true;
	button.nextElementSibling.disabled = false;
	showLog('Recording...', null, i);
}

function stopRecording(button, i) {
	if (i == 1) {
		recorder1 && recorder1.stop();
	} else {
		recorder2 && recorder2.stop();
	}
	showLog('Stopped recording.', null, i);

	button.disabled = true;
	button.previousElementSibling.disabled = false;

	// create WAV download link using audio data blob
	createDownloadLink(i);

	showLog('Stopped recording.', null, i);

	if (i == 1)
		recorder1.clear();
	else
		recorder2.clear();
}

function handleAudioEvent(blob, i) {
	let li = document.createElement('li');
	let player = document.createElement('audio');
	let hf = document.createElement('a');
	let br = document.createElement("br");
	let url = URL.createObjectURL(blob);
	let upload = document.createElement('a');

	player.controls = true;
	player.src = url;
	hf.href = url;
	upload.href = "#";
	upload.innerHTML = "Tải lên";
	hf.download = new Date().toISOString().replaceAll(':', '-');

	switch (blob.type) {
		case 'audio/wav':
			hf.download += '.wav';
			break;
		case 'audio/mpeg':
			hf.download += '.mp3';
			break;
		case 'audio/ogg':
			hf.download += '.ogg';
			break;
		default:
			alert('Don\'t support this audio file type, please choose other audio types, e.g. *.mp3, *.wav, *.ogg');
			return;
	}

	upload.addEventListener("click", function (event) {
		let xhr = new XMLHttpRequest();
		xhr.onload = function (e) {
			if (this.readyState === 4) {
				showLog('Server returned: ', e.target.responseText, i);
			}
		};
		let fd = new FormData();
		fd.append('audio_data', blob, hf.download);
		xhr.open('POST', '/api/UploadAudio', true);
		xhr.send(fd);
	});
	hf.innerHTML = hf.download;

	li.appendChild(player);
	li.appendChild(br);
	li.appendChild(hf);
	li.appendChild(document.createTextNode(" "));
	li.appendChild(upload);

	if (i == 1)
		recordingslist1.appendChild(li);
	else
		recordingslist2.appendChild(li);
}

function createDownloadLink(i) {
	if (i == 1)
		recorder1 && recorder1.exportWAV(blob => handleAudioEvent(blob, 1));
	else
		recorder2 && recorder2.exportWAV(blob => handleAudioEvent(blob, 2));
}

function deleteAll(i) {
	if (i == 1) {
		recordingslist1.innerHTML = '';
		btnAddFile1.value = '';
		log1.innerHTML = '';
	} else {
		recordingslist2.innerHTML = '';
		btnAddFile2.value = '';
		log2.innerHTML = '';
	}
}

window.onload = function init() {
	try {
		// webkit shim
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
		window.URL = window.URL || window.webkitURL;

		audio_context = new AudioContext();
		showLog('audio context set up.');
		showLog('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
	} catch (e) {
		alert('No web audio support in this browser!');
	}

	navigator.getUserMedia({ audio: true }, startUserMedia, function (e) {
		showLog('No live audio input: ' + e);
	});

	btnAddFile1.addEventListener('change', e => handleAudioEvent(e.target.files[0], 1));
	btnAddFile2.addEventListener('change', e => handleAudioEvent(e.target.files[0], 2));

};
