define([
    'IMSGlobal/jquery_2_1_1',
    'OAT/util/html',
    // todo: conditionnally get this for Edge?
    'audioRecordingInteraction/runtime/js/MediaStreamRecorder'
    //todo: check if Promise polyfill is needed ?
], function($, html, MediaStreamRecorder){
    'use strict';

    // from https://github.com/mozdevs/mediaDevices-getUserMedia-polyfill/blob/master/mediaDevices-getUserMedia-polyfill.js
    (function() {

        var promisifiedOldGUM = function(constraints, successCallback, errorCallback) {

            // First get ahold of getUserMedia, if present
            var getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if(!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }

            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise(function(successCallback, errorCallback) {
                getUserMedia.call(navigator, constraints, successCallback, errorCallback);
            });

        }

        // Older browsers might not implement mediaDevices at all, so we set an empty object first
        if(navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }

        // Some browsers partially implement mediaDevices. We can't just assign an object
        // with getUserMedia as it would overwrite existing properties.
        // Here, we will just add the getUserMedia property if it's missing.
        if(navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
        }

    }());





    return {
        render : function(id, container, config){

            var $container = $(container);

            var $recorderContainer = $container.find('.audioRec > .recorder');
            var $playerContainer = $container.find('.audioRec > .player');

            var $startButton = $('<button>', {
                text: 'Start recording'
            });

            var $stopButton = $('<button>', {
                text: 'Stop recording'
            });

            $recorderContainer.append($startButton);
            $recorderContainer.append($stopButton);

            // example

            // var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var audio = document.querySelector('audio');

            // getUserMedia block - grab stream
            // put it into a MediaStreamAudioSourceNode
            navigator.mediaDevices.getUserMedia ({ audio: true })
                .then(function(stream) {
                    var browser = 'FF';
                    var encoder = 'MSR';

                    // var profile = { id: 'OGG-OPUS-32',  mimeType: 'audio/ogg; codecs=opus', bitrate: 32000 };
                    // var profile = { id: 'OGG-32',       mimeType: 'audio/ogg',              bitrate: 32000 };
                    // var profile = { id: 'WEBM-32',      mimeType: 'audio/webm',             bitrate: 32000 };
                    var profile = { id: 'WAV-32',      mimeType: 'audio/wav',             bitrate: 32000 };


                    // audio.onloadedmetadata = function(e) {
                    //     audio.play();
                    //     audio.muted = 'true';
                    // };

                    // Standard mediaRecorder way:
                    // ===========================

                    /* * /
                    var options = {
                        audioBitsPerSecond : profile.bitrate,
                        mimeType : profile.mimeType
                    };
                    var mediaRecorder = new MediaRecorder(stream, options);

                    // console.dir(MediaRecorder);
                    // console.dir(MediaRecorder.canRecordMimeType('audio/ogg'));

                    // mediaRecorder.mimeType = 'audio/wav';
                    mediaRecorder.ondataavailable = function (blob) {
                    //todo: how do we set mimeType here ?
                        stopRecord(blob.data);
                    };
                    /* */



                    /* */
                    // mediaRecorder kind-of-polyfill way:
                    // ====================================

                    var mediaRecorder = new MediaStreamRecorder(stream);
                    mediaRecorder.mimeType = profile.mimeType;
                    mediaRecorder.ondataavailable = function (blob) {
                        stopRecord(blob);
                    };
                    /* */

                    // handlers
                    // ==========
                    $startButton.on('click', function record() {

                        // timeslice Optional
                        // This parameter takes a value of milliseconds, and represents the length of media capture to return in each Blob.
                        // If it is not specified, all media captured will be returned in a single Blob,
                        // unless one or more calls are made to MediaRecorder.requestData.
                        var timeSlice = 10000;
                        mediaRecorder.start(timeSlice);
                        // mediaRecorder.start();
                    });

                    $stopButton.on('click', function stopRecording() {
                        stopRecord();
                    });

                    function stopRecord(blob) {
                        mediaRecorder.stop();
                        if (blob) {
                            var blobURL = URL.createObjectURL(blob);
                            audio.src = blobURL;
                            // mediaRecorder.save();

                            var downloadLink = document.createElement('a');
                            document.body.appendChild(downloadLink);
                            downloadLink.text =
                                'download ' + profile.id + ' - ' + blob.type + ' : ' + Math.round((blob.size / 1000)) + 'KB';
                            downloadLink.download =
                                browser + ' - ' +
                                encoder + ' - ' +
                                profile.id + ' - ' + Date.now() +
                                '.' + blob.type.split('/')[1];
                            downloadLink.href = blobURL;
                        }
                    }

                    /* * /
                    (function checkSupportedMimeTypes(mediaRecorder) {
                        var mimeTypes = [
                            'audio/wav',
                            'audio/webm',
                            'audio/ogg'
                        ];

                        mimeTypes.forEach(function(type) {
                            var $p = $('p', {
                                text: type + ' = ' + mediaRecorder.canRecordMimeType(type)
                            });
                            $playerContainer.append($p);
                        });
                    }(mediaRecorder));
                    /* */


                    // Web audio API
                    // ===========================

                    // Create a MediaStreamAudioSourceNode
                    // Feed the HTMLMediaElement into it
                    // var source = audioCtx.createMediaStreamSource(stream);

                    // todo: read this from parameters
                    // var recorder = audioCtx.createScriptProcessor(4096, 1, 1);
                    //
                    // recorder.onaudioprocess = function(e) {
                    // };

                    // connect the AudioBufferSourceNode to the destination
                    // source.connect(recorder);
                    // recorder.connect(audioCtx.destination);

                })
                .catch(function(err) {
                    console.log('The following gUM error occured: ');
                    console.dir(err);
                });















                //render rich text content in prompt
            html.render($container.find('.prompt'));

        }
        // ,
        // renderChoices : function(id, container, config){
        //     renderChoices(id, $(container), config);
        // }
    };
});