"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoMeetingApp = exports.ContentShareType = void 0;
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
const aws4_axios_1 = require("aws4-axios");
const axios_1 = require("axios");
require("bootstrap");
require("./styleV2.scss");
const CircularCut_1 = require("./videofilter/CircularCut");
const EmojifyVideoFrameProcessor_1 = require("./videofilter/EmojifyVideoFrameProcessor");
const SegmentationProcessor_1 = require("./videofilter/SegmentationProcessor");
const SegmentationUtil_1 = require("./videofilter/SegmentationUtil");
const WebRTCStatsCollector_1 = require("./webrtcstatscollector/WebRTCStatsCollector");
const interceptor = aws4_axios_1.aws4Interceptor({
    region: 'ap-southeast-1',
}, {
    accessKeyId: "AKIAJI3Y5XWKQTDRL5HQ",
    secretAccessKey: "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",
});
axios_1.default.interceptors.request.use(interceptor);
let SHOULD_DIE_ON_FATALS = (() => {
    const isLocal = document.location.host === "127.0.0.1:8080" ||
        document.location.host === "localhost:8080";
    const fatalYes = document.location.search.includes("fatal=1");
    const fatalNo = document.location.search.includes("fatal=0");
    return fatalYes || (isLocal && !fatalNo);
})();
let DEBUG_LOG_PPS = false;
let fatal;
class DemoTileOrganizer {
    constructor() {
        this.tiles = {};
        this.tileStates = {};
        this.remoteTileCount = 0;
    }
    acquireTileIndex(tileId) {
        for (let index = 0; index <= DemoTileOrganizer.MAX_TILES; index++) {
            if (this.tiles[index] === tileId) {
                return index;
            }
        }
        for (let index = 0; index <= DemoTileOrganizer.MAX_TILES; index++) {
            if (!(index in this.tiles)) {
                this.tiles[index] = tileId;
                this.remoteTileCount++;
                return index;
            }
        }
        throw new Error("no tiles are available");
    }
    releaseTileIndex(tileId) {
        for (let index = 0; index <= DemoTileOrganizer.MAX_TILES; index++) {
            if (this.tiles[index] === tileId) {
                this.remoteTileCount--;
                delete this.tiles[index];
                return index;
            }
        }
        return DemoTileOrganizer.MAX_TILES;
    }
}
// this is index instead of length
DemoTileOrganizer.MAX_TILES = 17;
// Support a set of query parameters to allow for testing pre-release versions of
// Amazon Voice Focus. If none of these parameters are supplied, the SDK default
// values will be used.
const search = new URLSearchParams(document.location.search);
const VOICE_FOCUS_CDN = search.get("voiceFocusCDN") || undefined;
const VOICE_FOCUS_ASSET_GROUP = search.get("voiceFocusAssetGroup") || undefined;
const VOICE_FOCUS_REVISION_ID = search.get("voiceFocusRevisionID") || undefined;
const VOICE_FOCUS_PATHS = VOICE_FOCUS_CDN && {
    processors: `${VOICE_FOCUS_CDN}processors/`,
    wasm: `${VOICE_FOCUS_CDN}wasm/`,
    workers: `${VOICE_FOCUS_CDN}workers/`,
    models: `${VOICE_FOCUS_CDN}wasm/`,
};
const VOICE_FOCUS_SPEC = {
    assetGroup: VOICE_FOCUS_ASSET_GROUP,
    revisionID: VOICE_FOCUS_REVISION_ID,
    paths: VOICE_FOCUS_PATHS,
};
const VIDEO_FILTERS = ["Emojify", "CircularCut", "NoOp"];
class TestSound {
    constructor(logger, sinkId, frequency = 440, durationSec = 1, rampSec = 0.1, maxGainValue = 0.1) {
        this.logger = logger;
        this.sinkId = sinkId;
        this.frequency = frequency;
        this.durationSec = durationSec;
        this.rampSec = rampSec;
        this.maxGainValue = maxGainValue;
    }
    init() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            const oscillatorNode = audioContext.createOscillator();
            oscillatorNode.frequency.value = this.frequency;
            oscillatorNode.connect(gainNode);
            const destinationStream = audioContext.createMediaStreamDestination();
            gainNode.connect(destinationStream);
            const currentTime = audioContext.currentTime;
            const startTime = currentTime + 0.1;
            gainNode.gain.linearRampToValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.maxGainValue, startTime + this.rampSec);
            gainNode.gain.linearRampToValueAtTime(this.maxGainValue, startTime + this.rampSec + this.durationSec);
            gainNode.gain.linearRampToValueAtTime(0, startTime + this.rampSec * 2 + this.durationSec);
            oscillatorNode.start();
            const audioMixController = new amazon_chime_sdk_js_1.DefaultAudioMixController(this.logger);
            if (new amazon_chime_sdk_js_1.DefaultBrowserBehavior().supportsSetSinkId()) {
                try {
                    // @ts-ignore
                    yield audioMixController.bindAudioDevice({ deviceId: this.sinkId });
                }
                catch (e) {
                    fatal(e);
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error(`Failed to bind audio device: ${e}`);
                }
            }
            try {
                yield audioMixController.bindAudioElement(TestSound.testAudioElement);
            }
            catch (e) {
                fatal(e);
                (_b = this.logger) === null || _b === void 0 ? void 0 : _b.error(`Failed to bind audio element: ${e}`);
            }
            yield audioMixController.bindAudioStream(destinationStream.stream);
            new amazon_chime_sdk_js_1.TimeoutScheduler((this.rampSec * 2 + this.durationSec + 1) * 1000).start(() => {
                audioContext.close();
            });
        });
    }
}
TestSound.testAudioElement = new Audio();
var ContentShareType;
(function (ContentShareType) {
    ContentShareType[ContentShareType["ScreenCapture"] = 0] = "ScreenCapture";
    ContentShareType[ContentShareType["VideoFile"] = 1] = "VideoFile";
})(ContentShareType = exports.ContentShareType || (exports.ContentShareType = {}));
const SimulcastLayerMapping = {
    [amazon_chime_sdk_js_1.SimulcastLayers.Low]: "Low",
    [amazon_chime_sdk_js_1.SimulcastLayers.LowAndMedium]: "Low and Medium",
    [amazon_chime_sdk_js_1.SimulcastLayers.LowAndHigh]: "Low and High",
    [amazon_chime_sdk_js_1.SimulcastLayers.Medium]: "Medium",
    [amazon_chime_sdk_js_1.SimulcastLayers.MediumAndHigh]: "Medium and High",
    [amazon_chime_sdk_js_1.SimulcastLayers.High]: "High",
};
class DemoMeetingApp {
    constructor() {
        // Ideally we don't need to change this. Keep this configurable in case users have a super slow network.
        this.loadingBodyPixDependencyTimeoutMs = 10000;
        this.attendeeIdPresenceHandler = undefined;
        this.activeSpeakerHandler = undefined;
        this.showActiveSpeakerScores = false;
        this.activeSpeakerLayout = true;
        this.meeting = null;
        this.name = null;
        this.voiceConnectorId = null;
        this.sipURI = null;
        this.region = null;
        this.meetingSession = null;
        this.audioVideo = null;
        this.tileOrganizer = new DemoTileOrganizer();
        this.canStartLocalVideo = true;
        this.defaultBrowserBehaviour = new amazon_chime_sdk_js_1.DefaultBrowserBehavior();
        // eslint-disable-next-line
        this.roster = {};
        this.tileIndexToTileId = {};
        this.tileIdToTileIndex = {};
        this.tileIndexToPauseEventListener = {};
        this.tileArea = document.getElementById("tile-area");
        this.cameraDeviceIds = [];
        this.microphoneDeviceIds = [];
        this.buttonStates = {
            "button-microphone": true,
            "button-camera": false,
            "button-speaker": true,
            "button-content-share": false,
            "button-pause-content-share": false,
            "button-video-stats": false,
            "button-video-filter": false,
        };
        this.contentShareType = ContentShareType.ScreenCapture;
        // feature flags
        this.enableWebAudio = false;
        this.enableUnifiedPlanForChromiumBasedBrowsers = true;
        this.enableSimulcast = false;
        this.supportsVoiceFocus = false;
        this.enableVoiceFocus = false;
        this.voiceFocusIsActive = false;
        this.markdown = require("markdown-it")({ linkify: true });
        this.lastMessageSender = null;
        this.lastReceivedMessageTimestamp = 0;
        this.hasChromiumWebRTC = this.defaultBrowserBehaviour.hasChromiumWebRTC();
        this.statsCollector = new WebRTCStatsCollector_1.default();
        // This is an extremely minimal reactive programming approach: these elements
        // will be updated when the Amazon Voice Focus display state changes.
        this.voiceFocusDisplayables = [];
        this.chosenVideoFilter = "None";
        this.selectedVideoFilterItem = "None";
        this.meetingLogger = undefined;
        // If you want to make this a repeatable SPA, change this to 'spa'
        // and fix some state (e.g., video buttons).
        // Holding Shift while hitting the Leave button is handled by setting
        // this to `halt`, which allows us to stop and measure memory leaks.
        this.behaviorAfterLeave = "reload";
        this.selectedVideoInput = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.app = this;
        this.addFatalHandlers();
        if (document.location.search.includes("testfatal=1")) {
            this.fatal(new Error("Testing fatal."));
            return;
        }
        document.getElementById("sdk-version").innerText =
            "amazon-chime-sdk-js@" + amazon_chime_sdk_js_1.Versioning.sdkVersion;
        this.initEventListeners();
        this.initParameters();
        this.setMediaRegion();
        this.setUpVideoTileElementResizer();
        if (this.isRecorder() || this.isBroadcaster()) {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                this.meeting = new URL(window.location.href).searchParams.get("m");
                this.name = this.isRecorder()
                    ? "«Meeting Recorder»"
                    : "«Meeting Broadcaster»";
                yield this.authenticate();
                yield this.openAudioOutputFromSelection();
                yield this.join();
                this.displayButtonStates();
                this.switchToFlow("flow-meeting");
            }));
        }
        else {
            this.switchToFlow("flow-authenticate");
        }
    }
    addFatalHandlers() {
        fatal = this.fatal.bind(this);
        const onEvent = (event) => {
            // In Safari there's only a message.
            fatal(event.error || event.message);
        };
        // Listen for unhandled errors, too.
        window.addEventListener("error", onEvent);
        window.onunhandledrejection = (event) => {
            fatal(event.reason);
        };
        this.removeFatalHandlers = () => {
            window.onunhandledrejection = undefined;
            window.removeEventListener("error", onEvent);
            fatal = undefined;
            this.removeFatalHandlers = undefined;
        };
    }
    /**
     * We want to make it abundantly clear at development and testing time
     * when an unexpected error occurs.
     * If we're running locally, or we passed a `fatal=1` query parameter, fail hard.
     */
    fatal(e) {
        var _a;
        // Muffle mode: let the `try-catch` do its job.
        if (!SHOULD_DIE_ON_FATALS) {
            console.info("Ignoring fatal", e);
            return;
        }
        console.error("Fatal error: this was going to be caught, but should not have been thrown.", e);
        if (e && e instanceof Error) {
            document.getElementById("stack").innerText =
                e.message + "\n" + ((_a = e.stack) === null || _a === void 0 ? void 0 : _a.toString());
        }
        else {
            document.getElementById("stack").innerText = "" + e;
        }
        this.switchToFlow("flow-fatal");
    }
    initParameters() {
        const meeting = new URL(window.location.href).searchParams.get("m");
        if (meeting) {
            document.getElementById("inputMeeting").value = meeting;
            document.getElementById("inputName").focus();
        }
        else {
            document.getElementById("inputMeeting").focus();
        }
    }
    initVoiceFocus() {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = new amazon_chime_sdk_js_1.ConsoleLogger("SDK", amazon_chime_sdk_js_1.LogLevel.DEBUG);
            if (!this.enableWebAudio) {
                logger.info("[DEMO] Web Audio not enabled. Not checking for Amazon Voice Focus support.");
                return;
            }
            try {
                this.supportsVoiceFocus = yield amazon_chime_sdk_js_1.VoiceFocusDeviceTransformer.isSupported(VOICE_FOCUS_SPEC, {
                    logger,
                });
                if (this.supportsVoiceFocus) {
                    this.voiceFocusTransformer = yield this.getVoiceFocusDeviceTransformer();
                    this.supportsVoiceFocus =
                        this.voiceFocusTransformer &&
                            this.voiceFocusTransformer.isSupported();
                    if (this.supportsVoiceFocus) {
                        logger.info("[DEMO] Amazon Voice Focus is supported.");
                        document
                            .getElementById("voice-focus-setting")
                            .classList.remove("hidden");
                        yield this.populateAllDeviceLists();
                        return;
                    }
                }
            }
            catch (e) {
                // Fall through.
                logger.warn(`[DEMO] Does not support Amazon Voice Focus: ${e.message}`);
            }
            logger.warn("[DEMO] Does not support Amazon Voice Focus.");
            this.supportsVoiceFocus = false;
            document
                .getElementById("voice-focus-setting")
                .classList.toggle("hidden", true);
            yield this.populateAllDeviceLists();
        });
    }
    onVoiceFocusSettingChanged() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("[DEMO] Amazon Voice Focus setting toggled to", this.enableVoiceFocus);
            this.openAudioInputFromSelectionAndPreview();
        });
    }
    initEventListeners() {
        if (!this.defaultBrowserBehaviour.hasChromiumWebRTC()) {
            document.getElementById("simulcast").disabled = true;
            document.getElementById("planB").disabled = true;
        }
        document
            .getElementById("form-authenticate")
            .addEventListener("submit", (e) => {
            e.preventDefault();
            this.meeting = document.getElementById("inputMeeting").value;
            this.name = document.getElementById("inputName").value;
            this.region = document.getElementById("inputRegion").value;
            this.enableSimulcast = document.getElementById("simulcast").checked;
            if (this.enableSimulcast) {
                const videoInputQuality = document.getElementById("video-input-quality");
                videoInputQuality.value = "720p";
            }
            this.enableWebAudio = document.getElementById("webaudio").checked;
            // js sdk default to enable unified plan, equivalent to "Disable Unified Plan" default unchecked
            this.enableUnifiedPlanForChromiumBasedBrowsers = !document.getElementById("planB").checked;
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                let chimeMeetingId = "";
                this.showProgress("progress-authenticate");
                try {
                    chimeMeetingId = yield this.authenticate();
                }
                catch (error) {
                    console.error(error);
                    const httpErrorMessage = "UserMedia is not allowed in HTTP sites. Either use HTTPS or enable media capture on insecure sites.";
                    document.getElementById("failed-meeting").innerText = `Meeting ID: ${this.meeting}`;
                    document.getElementById("failed-meeting-error").innerText =
                        window.location.protocol === "http:"
                            ? httpErrorMessage
                            : error.message;
                    this.switchToFlow("flow-failed-meeting");
                    return;
                }
                document.getElementById("meeting-id").innerText = `${this.meeting} (${this.region})`;
                document.getElementById("chime-meeting-id").innerText = `Meeting ID: ${chimeMeetingId}`;
                document.getElementById("mobile-chime-meeting-id").innerText = `Meeting ID: ${chimeMeetingId}`;
                document.getElementById("mobile-attendee-id").innerText = `Attendee ID: ${this.meetingSession.configuration.credentials.attendeeId}`;
                document.getElementById("desktop-attendee-id").innerText = `Attendee ID: ${this.meetingSession.configuration.credentials.attendeeId}`;
                document.getElementById("info-meeting").innerText = this.meeting;
                document.getElementById("info-name").innerText = this.name;
                yield this.initVoiceFocus();
                this.switchToFlow("flow-devices");
                yield this.openAudioInputFromSelectionAndPreview();
                try {
                    yield this.openVideoInputFromSelection(document.getElementById("video-input")
                        .value, true);
                }
                catch (err) {
                    fatal(err);
                    this.log("no video input device selected");
                }
                yield this.openAudioOutputFromSelection();
                this.hideProgress("progress-authenticate");
            }));
        });
        const dieCheckbox = document.getElementById("die");
        dieCheckbox.checked = SHOULD_DIE_ON_FATALS;
        dieCheckbox.onchange = () => {
            SHOULD_DIE_ON_FATALS = !!dieCheckbox.checked;
        };
        const speechMonoCheckbox = document.getElementById("fullband-speech-mono-quality");
        const musicMonoCheckbox = document.getElementById("fullband-music-mono-quality");
        speechMonoCheckbox.addEventListener("change", (_e) => {
            if (speechMonoCheckbox.checked) {
                musicMonoCheckbox.checked = false;
            }
        });
        musicMonoCheckbox.addEventListener("change", (_e) => {
            if (musicMonoCheckbox.checked) {
                speechMonoCheckbox.checked = false;
            }
        });
        document.getElementById("to-sip-flow").addEventListener("click", (e) => {
            e.preventDefault();
            this.switchToFlow("flow-sip-authenticate");
        });
        document
            .getElementById("form-sip-authenticate")
            .addEventListener("submit", (e) => {
            e.preventDefault();
            this.meeting = document.getElementById("sip-inputMeeting").value;
            this.voiceConnectorId = document.getElementById("voiceConnectorId").value;
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                this.showProgress("progress-authenticate");
                const region = this.region || "us-east-1";
                try {
                    const response = yield fetch(`${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(this.meeting)}&name=${encodeURIComponent(DemoMeetingApp.DID)}&region=${encodeURIComponent(region)}`, {
                        method: "POST",
                    });
                    const json = yield response.json();
                    const joinToken = json.JoinInfo.Attendee.Attendee.JoinToken;
                    this.sipURI = `sip:${DemoMeetingApp.DID}@${this.voiceConnectorId};transport=tls;X-joinToken=${joinToken}`;
                    this.switchToFlow("flow-sip-uri");
                }
                catch (error) {
                    document.getElementById("failed-meeting").innerText = `Meeting ID: ${this.meeting}`;
                    document.getElementById("failed-meeting-error").innerText = error.message;
                    this.switchToFlow("flow-failed-meeting");
                    return;
                }
                const sipUriElement = document.getElementById("sip-uri");
                sipUriElement.value = this.sipURI;
                this.hideProgress("progress-authenticate");
            }));
        });
        document.getElementById("copy-sip-uri").addEventListener("click", () => {
            const sipUriElement = document.getElementById("sip-uri");
            sipUriElement.select();
            document.execCommand("copy");
        });
        const audioInput = document.getElementById("audio-input");
        audioInput.addEventListener("change", (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log("audio input device is changed");
            yield this.openAudioInputFromSelectionAndPreview();
        }));
        const videoInput = document.getElementById("video-input");
        videoInput.addEventListener("change", (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log("video input device is changed");
            try {
                yield this.openVideoInputFromSelection(videoInput.value, true);
            }
            catch (err) {
                fatal(err);
                this.log("no video input device selected");
            }
        }));
        const videoInputQuality = document.getElementById("video-input-quality");
        videoInputQuality.addEventListener("change", (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log("Video input quality is changed");
            switch (videoInputQuality.value) {
                case "360p":
                    this.audioVideo.chooseVideoInputQuality(640, 360, 15, 600);
                    break;
                case "540p":
                    this.audioVideo.chooseVideoInputQuality(960, 540, 15, 1400);
                    break;
                case "720p":
                    this.audioVideo.chooseVideoInputQuality(1280, 720, 15, 1400);
                    break;
            }
            try {
                yield this.openVideoInputFromSelection(videoInput.value, true);
            }
            catch (err) {
                fatal(err);
                this.log("no video input device selected");
            }
        }));
        const audioOutput = document.getElementById("audio-output");
        audioOutput.addEventListener("change", (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log("audio output device is changed");
            yield this.openAudioOutputFromSelection();
        }));
        document
            .getElementById("button-test-sound")
            .addEventListener("click", (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const audioOutput = document.getElementById("audio-output");
            const testSound = new TestSound(this.meetingEventPOSTLogger, audioOutput.value);
            yield testSound.init();
        }));
        document.getElementById("form-devices").addEventListener("submit", (e) => {
            e.preventDefault();
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.showProgress("progress-join");
                    yield this.stopAudioPreview();
                    this.audioVideo.stopVideoPreviewForVideoInput(document.getElementById("video-preview"));
                    yield this.join();
                    this.audioVideo.chooseVideoInputDevice(null);
                    this.hideProgress("progress-join");
                    this.displayButtonStates();
                    this.switchToFlow("flow-meeting");
                    if (DEBUG_LOG_PPS) {
                        this.logPPS();
                        DEBUG_LOG_PPS = false; // Only do this once.
                    }
                }
                catch (error) {
                    document.getElementById("failed-join").innerText = `Meeting ID: ${this.meeting}`;
                    document.getElementById("failed-join-error").innerText = `Error: ${error.message}`;
                }
            }));
        });
        document.getElementById("add-voice-focus").addEventListener("change", (e) => {
            this.enableVoiceFocus = e.target.checked;
            this.onVoiceFocusSettingChanged();
        });
        const buttonMute = document.getElementById("button-microphone");
        buttonMute.addEventListener("mousedown", (_e) => {
            if (this.toggleButton("button-microphone")) {
                this.audioVideo.realtimeUnmuteLocalAudio();
            }
            else {
                this.audioVideo.realtimeMuteLocalAudio();
            }
        });
        const buttonVideo = document.getElementById("button-camera");
        buttonVideo.addEventListener("click", (_e) => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                if (this.toggleButton("button-camera") && this.canStartLocalVideo) {
                    try {
                        let camera = videoInput.value;
                        if (videoInput.value === "None") {
                            camera = this.cameraDeviceIds.length
                                ? this.cameraDeviceIds[0]
                                : "None";
                        }
                        yield this.openVideoInputFromSelection(camera, false);
                        this.audioVideo.startLocalVideoTile();
                    }
                    catch (err) {
                        fatal(err);
                        this.log("no video input device selected");
                    }
                }
                else {
                    this.audioVideo.stopLocalVideoTile();
                    this.hideTile(DemoTileOrganizer.MAX_TILES);
                }
            }));
        });
        let action = true;
        let taskId = "";
        const buttonRecord = document.getElementById("button-record");
        buttonRecord.addEventListener("click", (_e) => {
            axios_1.default
                .get(`${DemoMeetingApp.BASE_URL}recording?=${encodeURIComponent(window.location.href)}`, {
                // headers:{"Access-Control-Allow-Origin": "*"}
                params: {
                    recordingAction: action ? "start" : "stop",
                    meetingURL: window.location.href,
                    taskId,
                },
            })
                .then((data) => {
                action = !action;
                taskId = data.data.taskId;
            });
            // AsyncScheduler.nextTick(async () => {
            //   if (this.toggleButton('button-camera') && this.canStartLocalVideo) {
            //     try {
            //       let camera: string = videoInput.value;
            //       if (videoInput.value === 'None') {
            //         camera = this.cameraDeviceIds.length ? this.cameraDeviceIds[0] : 'None';
            //       }
            //       await this.openVideoInputFromSelection(camera, false);
            //       this.audioVideo.startLocalVideoTile();
            //     } catch (err) {
            //       fatal(err);
            //       this.log('no video input device selected');
            //     }
            //   } else {
            //     this.audioVideo.stopLocalVideoTile();
            //     this.hideTile(DemoTileOrganizer.MAX_TILES);
            //   }
            // });
        });
        const buttonPauseContentShare = document.getElementById("button-pause-content-share");
        buttonPauseContentShare.addEventListener("click", (_e) => {
            if (!this.isButtonOn("button-content-share")) {
                return;
            }
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                if (this.toggleButton("button-pause-content-share")) {
                    this.audioVideo.pauseContentShare();
                    if (this.contentShareType === ContentShareType.VideoFile) {
                        const videoFile = document.getElementById("content-share-video");
                        videoFile.pause();
                    }
                }
                else {
                    this.audioVideo.unpauseContentShare();
                    if (this.contentShareType === ContentShareType.VideoFile) {
                        const videoFile = document.getElementById("content-share-video");
                        yield videoFile.play();
                    }
                }
            }));
        });
        const buttonContentShare = document.getElementById("button-content-share");
        buttonContentShare.addEventListener("click", (_e) => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => {
                if (!this.isButtonOn("button-content-share")) {
                    this.contentShareStart();
                }
                else {
                    this.contentShareStop();
                }
            });
        });
        const buttonSpeaker = document.getElementById("button-speaker");
        buttonSpeaker.addEventListener("click", (_e) => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                if (this.toggleButton("button-speaker")) {
                    try {
                        yield this.audioVideo.bindAudioElement(document.getElementById("meeting-audio"));
                    }
                    catch (e) {
                        fatal(e);
                        this.log("Failed to bindAudioElement", e);
                    }
                }
                else {
                    this.audioVideo.unbindAudioElement();
                }
            }));
        });
        const buttonVideoStats = document.getElementById("button-video-stats");
        buttonVideoStats.addEventListener("click", () => {
            if (this.isButtonOn("button-video-stats")) {
                document.querySelectorAll(".stats-info").forEach((e) => e.remove());
            }
            else {
                this.getRelayProtocol();
            }
            this.toggleButton("button-video-stats");
        });
        const sendMessage = () => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => {
                const textArea = document.getElementById("send-message");
                const textToSend = textArea.value.trim();
                if (!textToSend) {
                    return;
                }
                textArea.value = "";
                this.audioVideo.realtimeSendDataMessage(DemoMeetingApp.DATA_MESSAGE_TOPIC, textToSend, DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS);
                // echo the message to the handler
                this.dataMessageHandler(new amazon_chime_sdk_js_1.DataMessage(Date.now(), DemoMeetingApp.DATA_MESSAGE_TOPIC, new TextEncoder().encode(textToSend), this.meetingSession.configuration.credentials.attendeeId, this.meetingSession.configuration.credentials.externalUserId));
            });
        };
        const textAreaSendMessage = document.getElementById("send-message");
        textAreaSendMessage.addEventListener("keydown", (e) => {
            if (e.keyCode === 13) {
                if (e.shiftKey) {
                    textAreaSendMessage.rows++;
                }
                else {
                    e.preventDefault();
                    sendMessage();
                    textAreaSendMessage.rows = 1;
                }
            }
        });
        const buttonMeetingEnd = document.getElementById("button-meeting-end");
        buttonMeetingEnd.addEventListener("click", (_e) => {
            const confirmEnd = new URL(window.location.href).searchParams.get("confirm-end") ===
                "true";
            const prompt = "Are you sure you want to end the meeting for everyone? The meeting cannot be used after ending it.";
            if (confirmEnd && !window.confirm(prompt)) {
                return;
            }
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                buttonMeetingEnd.disabled = true;
                yield this.endMeeting();
                yield this.leave();
                buttonMeetingEnd.disabled = false;
            }));
        });
        const buttonMeetingLeave = document.getElementById("button-meeting-leave");
        buttonMeetingLeave.addEventListener("click", (e) => {
            if (e.shiftKey) {
                this.behaviorAfterLeave = "halt";
            }
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                buttonMeetingLeave.disabled = true;
                yield this.leave();
                buttonMeetingLeave.disabled = false;
            }));
        });
    }
    logPPS() {
        let start = 0;
        let packets = 0;
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (!this.audioVideo) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stats = (yield this.audioVideo.getRTCPeerConnectionStats());
            if (!stats) {
                return;
            }
            if (!start) {
                start = Date.now();
                return;
            }
            for (const [_, entry] of stats.entries()) {
                if (entry.type === "outbound-rtp") {
                    const now = Date.now();
                    const deltat = now - start;
                    const deltap = entry.packetsSent - packets;
                    console.info("PPS:", (1000 * deltap) / deltat);
                    start = now;
                    packets = entry.packetsSent;
                    return;
                }
            }
        }), 1000);
    }
    getSupportedMediaRegions() {
        const supportedMediaRegions = [];
        const mediaRegion = document.getElementById("inputRegion");
        for (let i = 0; i < mediaRegion.length; i++) {
            supportedMediaRegions.push(mediaRegion.value);
        }
        return supportedMediaRegions;
    }
    getNearestMediaRegion() {
        return __awaiter(this, void 0, void 0, function* () {
            const nearestMediaRegionResponse = yield fetch(`https://nearest-media-region.l.chime.aws`, {
                method: "GET",
            });
            const nearestMediaRegionJSON = yield nearestMediaRegionResponse.json();
            const nearestMediaRegion = nearestMediaRegionJSON.region;
            return nearestMediaRegion;
        });
    }
    setMediaRegion() {
        amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const nearestMediaRegion = yield this.getNearestMediaRegion();
                if (nearestMediaRegion === "" || nearestMediaRegion === null) {
                    throw new Error("Nearest Media Region cannot be null or empty");
                }
                const supportedMediaRegions = this.getSupportedMediaRegions();
                if (supportedMediaRegions.indexOf(nearestMediaRegion) === -1) {
                    supportedMediaRegions.push(nearestMediaRegion);
                    const mediaRegionElement = document.getElementById("inputRegion");
                    const newMediaRegionOption = document.createElement("option");
                    newMediaRegionOption.value = nearestMediaRegion;
                    newMediaRegionOption.text =
                        nearestMediaRegion + " (" + nearestMediaRegion + ")";
                    mediaRegionElement.add(newMediaRegionOption, null);
                }
                document.getElementById("inputRegion").value = nearestMediaRegion;
            }
            catch (error) {
                fatal(error);
                this.log("Default media region selected: " + error.message);
            }
        }));
    }
    toggleButton(button, state) {
        if (state === "on") {
            this.buttonStates[button] = true;
        }
        else if (state === "off") {
            this.buttonStates[button] = false;
        }
        else {
            this.buttonStates[button] = !this.buttonStates[button];
        }
        this.displayButtonStates();
        return this.buttonStates[button];
    }
    isButtonOn(button) {
        return this.buttonStates[button];
    }
    displayButtonStates() {
        for (const button in this.buttonStates) {
            const element = document.getElementById(button);
            const drop = document.getElementById(`${button}-drop`);
            const on = this.buttonStates[button];
            element.classList.add(on ? "btn-success" : "btn-outline-secondary");
            element.classList.remove(on ? "btn-outline-secondary" : "btn-success");
            element.firstElementChild.classList.add(on ? "svg-active" : "svg-inactive");
            element.firstElementChild.classList.remove(on ? "svg-inactive" : "svg-active");
            if (drop) {
                drop.classList.add(on ? "btn-success" : "btn-outline-secondary");
                drop.classList.remove(on ? "btn-outline-secondary" : "btn-success");
            }
        }
    }
    showProgress(id) {
        document.getElementById(id).style.visibility =
            "visible";
    }
    hideProgress(id) {
        document.getElementById(id).style.visibility = "hidden";
    }
    switchToFlow(flow) {
        Array.from(document.getElementsByClassName("flow")).map((e) => (e.style.display = "none"));
        document.getElementById(flow).style.display = "block";
    }
    onAudioInputsChanged(freshDevices) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.populateAudioInputList();
            if (!this.currentAudioInputDevice) {
                return;
            }
            if (this.currentAudioInputDevice === "default") {
                // The default device might actually have changed. Go ahead and trigger a
                // reselection.
                this.log("Reselecting default device.");
                yield this.selectAudioInputDevice(this.currentAudioInputDevice);
                return;
            }
            const freshDeviceWithSameID = freshDevices.find((device) => device.deviceId === this.currentAudioInputDevice);
            if (freshDeviceWithSameID === undefined) {
                this.log("Existing device disappeared. Selecting a new one.");
                // Select a new device.
                yield this.openAudioInputFromSelectionAndPreview();
            }
        });
    }
    audioInputsChanged(freshAudioInputDeviceList) {
        this.onAudioInputsChanged(freshAudioInputDeviceList);
    }
    videoInputsChanged(_freshVideoInputDeviceList) {
        this.populateVideoInputList();
    }
    audioOutputsChanged(_freshAudioOutputDeviceList) {
        this.populateAudioOutputList();
    }
    audioInputStreamEnded(deviceId) {
        this.log(`Current audio input stream from device id ${deviceId} ended.`);
    }
    videoInputStreamEnded(deviceId) {
        this.log(`Current video input stream from device id ${deviceId} ended.`);
    }
    estimatedDownlinkBandwidthLessThanRequired(estimatedDownlinkBandwidthKbps, requiredVideoDownlinkBandwidthKbps) {
        this.log(`Estimated downlink bandwidth is ${estimatedDownlinkBandwidthKbps} is less than required bandwidth for video ${requiredVideoDownlinkBandwidthKbps}`);
    }
    videoNotReceivingEnoughData(videoReceivingReports) {
        this.log(`One or more video streams are not receiving expected amounts of data ${JSON.stringify(videoReceivingReports)}`);
    }
    metricsDidReceive(clientMetricReport) {
        const metricReport = clientMetricReport.getObservableMetrics();
        if (typeof metricReport.availableSendBandwidth === "number" &&
            !isNaN(metricReport.availableSendBandwidth)) {
            document.getElementById("video-uplink-bandwidth").innerText =
                "Available Uplink Bandwidth: " +
                    String(metricReport.availableSendBandwidth / 1000) +
                    " Kbps";
        }
        else if (typeof metricReport.availableOutgoingBitrate === "number" &&
            !isNaN(metricReport.availableOutgoingBitrate)) {
            document.getElementById("video-uplink-bandwidth").innerText =
                "Available Uplink Bandwidth: " +
                    String(metricReport.availableOutgoingBitrate / 1000) +
                    " Kbps";
        }
        else {
            document.getElementById("video-uplink-bandwidth").innerText = "Available Uplink Bandwidth: Unknown";
        }
        if (typeof metricReport.availableReceiveBandwidth === "number" &&
            !isNaN(metricReport.availableReceiveBandwidth)) {
            document.getElementById("video-downlink-bandwidth").innerText =
                "Available Downlink Bandwidth: " +
                    String(metricReport.availableReceiveBandwidth / 1000) +
                    " Kbps";
        }
        else if (typeof metricReport.availableIncomingBitrate === "number" &&
            !isNaN(metricReport.availableIncomingBitrate)) {
            document.getElementById("video-downlink-bandwidth").innerText =
                "Available Downlink Bandwidth: " +
                    String(metricReport.availableIncomingBitrate / 1000) +
                    " Kbps";
        }
        else {
            document.getElementById("video-downlink-bandwidth").innerText = "Available Downlink Bandwidth: Unknown";
        }
        this.hasChromiumWebRTC &&
            this.isButtonOn("button-video-stats") &&
            this.getAndShowWebRTCStats();
    }
    getAndShowWebRTCStats() {
        const videoTiles = this.audioVideo.getAllVideoTiles();
        if (videoTiles.length === 0) {
            return;
        }
        for (const videoTile of videoTiles) {
            const tileState = videoTile.state();
            if (tileState.paused || tileState.isContent) {
                continue;
            }
            const tileId = videoTile.id();
            const tileIndex = this.tileIdToTileIndex[tileId];
            this.getStats(tileIndex);
            if (tileState.localTile) {
                this.statsCollector.showUpstreamStats(tileIndex);
            }
            else {
                this.statsCollector.showDownstreamStats(tileIndex);
            }
        }
    }
    getRelayProtocol() {
        return __awaiter(this, void 0, void 0, function* () {
            const rawStats = yield this.audioVideo.getRTCPeerConnectionStats();
            if (rawStats) {
                rawStats.forEach((report) => {
                    if (report.type === "local-candidate") {
                        this.log(`Local WebRTC Ice Candidate stats: ${JSON.stringify(report)}`);
                        const relayProtocol = report.relayProtocol;
                        if (typeof relayProtocol === "string") {
                            if (relayProtocol === "udp") {
                                this.log(`Connection using ${relayProtocol.toUpperCase()} protocol`);
                            }
                            else {
                                this.log(`Connection fell back to ${relayProtocol.toUpperCase()} protocol`);
                            }
                        }
                    }
                });
            }
        });
    }
    getStats(tileIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = `video-${tileIndex}`;
            const videoElement = document.getElementById(id);
            if (!videoElement || !videoElement.srcObject) {
                return;
            }
            const stream = videoElement.srcObject;
            const tracks = stream.getVideoTracks();
            if (tracks.length === 0) {
                return;
            }
            const report = yield this.audioVideo.getRTCPeerConnectionStats(tracks[0]);
            this.statsCollector.processWebRTCStatReportForTileIndex(report, tileIndex);
        });
    }
    createLogStream(configuration, pathname) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = JSON.stringify({
                meetingId: configuration.meetingId,
                attendeeId: configuration.credentials.attendeeId,
            });
            try {
                const response = yield fetch(`${DemoMeetingApp.BASE_URL}${pathname}`, {
                    method: "POST",
                    body,
                });
                if (response.status === 200) {
                    console.log("[DEMO] log stream created");
                }
            }
            catch (error) {
                fatal(error);
                this.log(error.message);
            }
        });
    }
    eventDidReceive(name, attributes) {
        var _a, _b;
        this.log(`Received an event: ${JSON.stringify({ name, attributes })}`);
        const { meetingHistory } = attributes, otherAttributes = __rest(attributes, ["meetingHistory"]);
        switch (name) {
            case "meetingStartRequested":
            case "meetingStartSucceeded":
            case "meetingEnded":
            case "audioInputSelected":
            case "videoInputSelected":
            case "audioInputUnselected":
            case "videoInputUnselected":
            case "attendeePresenceReceived": {
                // Exclude the "meetingHistory" attribute for successful events.
                (_a = this.meetingEventPOSTLogger) === null || _a === void 0 ? void 0 : _a.info(JSON.stringify({
                    name,
                    attributes: otherAttributes,
                }));
                break;
            }
            case "audioInputFailed":
            case "videoInputFailed":
            case "meetingStartFailed":
            case "meetingFailed": {
                // Send the last 5 minutes of events.
                (_b = this.meetingEventPOSTLogger) === null || _b === void 0 ? void 0 : _b.info(JSON.stringify({
                    name,
                    attributes: Object.assign(Object.assign({}, otherAttributes), { meetingHistory: meetingHistory.filter(({ timestampMs }) => {
                            return (Date.now() - timestampMs <
                                DemoMeetingApp.MAX_MEETING_HISTORY_MS);
                        }) }),
                }));
                break;
            }
        }
    }
    initializeMeetingSession(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            const logLevel = amazon_chime_sdk_js_1.LogLevel.INFO;
            const consoleLogger = (this.meetingLogger = new amazon_chime_sdk_js_1.ConsoleLogger("SDK", logLevel));
            // if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            this.meetingLogger = consoleLogger;
            // } else {
            //   await Promise.all([
            //     this.createLogStream(configuration, 'create_log_stream'),
            //     this.createLogStream(configuration, 'create_browser_event_log_stream'),
            //   ]);
            //   this.meetingSessionPOSTLogger = new MeetingSessionPOSTLogger(
            //     'SDK',
            //     configuration,
            //     DemoMeetingApp.LOGGER_BATCH_SIZE,
            //     DemoMeetingApp.LOGGER_INTERVAL_MS,
            //     `${DemoMeetingApp.BASE_URL}logs`,
            //     logLevel
            //   );
            //   this.meetingLogger = new MultiLogger(consoleLogger, this.meetingSessionPOSTLogger);
            //   this.meetingEventPOSTLogger = new MeetingSessionPOSTLogger(
            //     'SDKEvent',
            //     configuration,
            //     DemoMeetingApp.LOGGER_BATCH_SIZE,
            //     DemoMeetingApp.LOGGER_INTERVAL_MS,
            //     `${DemoMeetingApp.BASE_URL}log_meeting_event`,
            //     logLevel
            //   );
            // }
            const deviceController = new amazon_chime_sdk_js_1.DefaultDeviceController(this.meetingLogger, {
                enableWebAudio: this.enableWebAudio,
            });
            configuration.enableUnifiedPlanForChromiumBasedBrowsers = this.enableUnifiedPlanForChromiumBasedBrowsers;
            const urlParameters = new URL(window.location.href).searchParams;
            const timeoutMs = Number(urlParameters.get("attendee-presence-timeout-ms"));
            if (!isNaN(timeoutMs)) {
                configuration.attendeePresenceTimeoutMs = Number(timeoutMs);
            }
            configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
            this.meetingSession = new amazon_chime_sdk_js_1.DefaultMeetingSession(configuration, this.meetingLogger, deviceController);
            if (document.getElementById("fullband-speech-mono-quality").checked) {
                this.meetingSession.audioVideo.setAudioProfile(amazon_chime_sdk_js_1.AudioProfile.fullbandSpeechMono());
                this.meetingSession.audioVideo.setContentAudioProfile(amazon_chime_sdk_js_1.AudioProfile.fullbandSpeechMono());
            }
            else if (document.getElementById("fullband-music-mono-quality").checked) {
                this.meetingSession.audioVideo.setAudioProfile(amazon_chime_sdk_js_1.AudioProfile.fullbandMusicMono());
                this.meetingSession.audioVideo.setContentAudioProfile(amazon_chime_sdk_js_1.AudioProfile.fullbandMusicMono());
            }
            this.audioVideo = this.meetingSession.audioVideo;
            if (this.enableSimulcast) {
                this.audioVideo.chooseVideoInputQuality(1280, 720, 15, 1400);
            }
            this.audioVideo.addDeviceChangeObserver(this);
            this.setupDeviceLabelTrigger();
            yield this.populateAllDeviceLists();
            this.setupMuteHandler();
            this.setupCanUnmuteHandler();
            this.setupSubscribeToAttendeeIdPresenceHandler();
            this.setupDataMessage();
            this.audioVideo.addObserver(this);
            this.audioVideo.addContentShareObserver(this);
            this.initContentShareDropDownItems();
        });
    }
    join() {
        return __awaiter(this, void 0, void 0, function* () {
            window.addEventListener("unhandledrejection", (event) => {
                this.log(event.reason);
            });
            this.audioVideo.start();
        });
    }
    leave() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.statsCollector.resetStats();
            this.audioVideo.stop();
            yield ((_a = this.voiceFocusDevice) === null || _a === void 0 ? void 0 : _a.stop());
            this.voiceFocusDevice = undefined;
            yield ((_b = this.chosenVideoTransformDevice) === null || _b === void 0 ? void 0 : _b.stop());
            this.chosenVideoTransformDevice = undefined;
            this.roster = {};
        });
    }
    setupMuteHandler() {
        const handler = (isMuted) => {
            this.log(`muted = ${isMuted}`);
        };
        this.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(handler);
        const isMuted = this.audioVideo.realtimeIsLocalAudioMuted();
        handler(isMuted);
    }
    setupCanUnmuteHandler() {
        const handler = (canUnmute) => {
            this.log(`canUnmute = ${canUnmute}`);
        };
        this.audioVideo.realtimeSubscribeToSetCanUnmuteLocalAudio(handler);
        handler(this.audioVideo.realtimeCanUnmuteLocalAudio());
    }
    updateRoster() {
        const roster = document.getElementById("roster");
        const newRosterCount = Object.keys(this.roster).length;
        while (roster.getElementsByTagName("li").length < newRosterCount) {
            const li = document.createElement("li");
            li.className =
                "list-group-item d-flex justify-content-between align-items-center";
            li.appendChild(document.createElement("span"));
            li.appendChild(document.createElement("span"));
            roster.appendChild(li);
        }
        while (roster.getElementsByTagName("li").length > newRosterCount) {
            roster.removeChild(roster.getElementsByTagName("li")[0]);
        }
        const entries = roster.getElementsByTagName("li");
        let i = 0;
        for (const attendeeId in this.roster) {
            const spanName = entries[i].getElementsByTagName("span")[0];
            const spanStatus = entries[i].getElementsByTagName("span")[1];
            let statusClass = "badge badge-pill ";
            let statusText = "\xa0"; // &nbsp
            if (this.roster[attendeeId].signalStrength < 1) {
                statusClass += "badge-warning";
            }
            else if (this.roster[attendeeId].signalStrength === 0) {
                statusClass += "badge-danger";
            }
            else if (this.roster[attendeeId].muted) {
                statusText = "MUTED";
                statusClass += "badge-secondary";
            }
            else if (this.roster[attendeeId].active) {
                statusText = "SPEAKING";
                statusClass += "badge-success";
            }
            else if (this.roster[attendeeId].volume > 0) {
                statusClass += "badge-success";
            }
            this.updateProperty(spanName, "innerText", this.roster[attendeeId].name);
            this.updateProperty(spanStatus, "innerText", statusText);
            this.updateProperty(spanStatus, "className", statusClass);
            i++;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateProperty(obj, key, value) {
        if (value !== undefined && obj[key] !== value) {
            obj[key] = value;
        }
    }
    setupSubscribeToAttendeeIdPresenceHandler() {
        const handler = (attendeeId, present, externalUserId, dropped) => {
            this.log(`${attendeeId} present = ${present} (${externalUserId})`);
            const isContentAttendee = new amazon_chime_sdk_js_1.DefaultModality(attendeeId).hasModality(amazon_chime_sdk_js_1.DefaultModality.MODALITY_CONTENT);
            const isSelfAttendee = new amazon_chime_sdk_js_1.DefaultModality(attendeeId).base() ===
                this.meetingSession.configuration.credentials.attendeeId;
            if (!present) {
                delete this.roster[attendeeId];
                this.updateRoster();
                this.log(`${attendeeId} dropped = ${dropped} (${externalUserId})`);
                return;
            }
            //If someone else share content, stop the current content share
            if (!this.allowMaxContentShare() &&
                !isSelfAttendee &&
                isContentAttendee &&
                this.isButtonOn("button-content-share")) {
                this.contentShareStop();
            }
            if (!this.roster[attendeeId]) {
                this.roster[attendeeId] = {
                    name: externalUserId.split("#").slice(-1)[0] +
                        (isContentAttendee ? " «Content»" : ""),
                };
            }
            this.audioVideo.realtimeSubscribeToVolumeIndicator(attendeeId, (attendeeId, volume, muted, signalStrength) => __awaiter(this, void 0, void 0, function* () {
                if (!this.roster[attendeeId]) {
                    return;
                }
                if (volume !== null) {
                    this.roster[attendeeId].volume = Math.round(volume * 100);
                }
                if (muted !== null) {
                    this.roster[attendeeId].muted = muted;
                }
                if (signalStrength !== null) {
                    this.roster[attendeeId].signalStrength = Math.round(signalStrength * 100);
                }
                this.updateRoster();
            }));
        };
        this.attendeeIdPresenceHandler = handler;
        this.audioVideo.realtimeSubscribeToAttendeeIdPresence(handler);
        // Hang on to this so we can unsubscribe later.
        this.activeSpeakerHandler = (attendeeIds) => {
            for (const attendeeId in this.roster) {
                this.roster[attendeeId].active = false;
            }
            for (const attendeeId of attendeeIds) {
                if (this.roster[attendeeId]) {
                    this.roster[attendeeId].active = true;
                    break; // only show the most active speaker
                }
            }
            this.layoutFeaturedTile();
        };
        const scoreHandler = (scores) => {
            for (const attendeeId in scores) {
                if (this.roster[attendeeId]) {
                    this.roster[attendeeId].score = scores[attendeeId];
                }
            }
            this.updateRoster();
        };
        this.audioVideo.subscribeToActiveSpeakerDetector(new amazon_chime_sdk_js_1.DefaultActiveSpeakerPolicy(), this.activeSpeakerHandler, scoreHandler, this.showActiveSpeakerScores ? 100 : 0);
    }
    getStatsForOutbound(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoElement = document.getElementById(id);
            const stream = videoElement.srcObject;
            const track = stream.getVideoTracks()[0];
            const basicReports = {};
            const reports = yield this.audioVideo.getRTCPeerConnectionStats(track);
            let duration;
            reports.forEach((report) => {
                if (report.type === "outbound-rtp") {
                    // remained to be calculated
                    this.log(`${id} is bound to ssrc ${report.ssrc}`);
                    basicReports["bitrate"] = report.bytesSent;
                    basicReports["width"] = report.frameWidth;
                    basicReports["height"] = report.frameHeight;
                    basicReports["fps"] = report.framesEncoded;
                    duration = report.timestamp;
                }
            });
            yield new amazon_chime_sdk_js_1.TimeoutScheduler(1000).start(() => {
                this.audioVideo.getRTCPeerConnectionStats(track).then((reports) => {
                    reports.forEach((report) => {
                        if (report.type === "outbound-rtp") {
                            duration = report.timestamp - duration;
                            duration = duration / 1000;
                            // remained to be calculated
                            basicReports["bitrate"] = Math.trunc(((report.bytesSent - basicReports["bitrate"]) * 8) / duration);
                            basicReports["width"] = report.frameWidth;
                            basicReports["height"] = report.frameHeight;
                            basicReports["fps"] = Math.trunc((report.framesEncoded - basicReports["fps"]) / duration);
                            this.log(JSON.stringify(basicReports));
                        }
                    });
                });
            });
        });
    }
    dataMessageHandler(dataMessage) {
        if (!dataMessage.throttled) {
            const isSelf = dataMessage.senderAttendeeId ===
                this.meetingSession.configuration.credentials.attendeeId;
            if (dataMessage.timestampMs <= this.lastReceivedMessageTimestamp) {
                return;
            }
            this.lastReceivedMessageTimestamp = dataMessage.timestampMs;
            const messageDiv = document.getElementById("receive-message");
            const messageNameSpan = document.createElement("div");
            messageNameSpan.classList.add("message-bubble-sender");
            messageNameSpan.innerText = dataMessage.senderExternalUserId
                .split("#")
                .slice(-1)[0];
            const messageTextSpan = document.createElement("div");
            messageTextSpan.classList.add(isSelf ? "message-bubble-self" : "message-bubble-other");
            messageTextSpan.innerHTML = this.markdown
                .render(dataMessage.text())
                .replace(/[<]a /g, '<a target="_blank" ');
            const appendClass = (element, className) => {
                for (let i = 0; i < element.children.length; i++) {
                    const child = element.children[i];
                    child.classList.add(className);
                    appendClass(child, className);
                }
            };
            appendClass(messageTextSpan, "markdown");
            if (this.lastMessageSender !== dataMessage.senderAttendeeId) {
                messageDiv.appendChild(messageNameSpan);
            }
            this.lastMessageSender = dataMessage.senderAttendeeId;
            messageDiv.appendChild(messageTextSpan);
            messageDiv.scrollTop = messageDiv.scrollHeight;
        }
        else {
            this.log("Message is throttled. Please resend");
        }
    }
    setupDataMessage() {
        this.audioVideo.realtimeSubscribeToReceiveDataMessage(DemoMeetingApp.DATA_MESSAGE_TOPIC, (dataMessage) => {
            this.dataMessageHandler(dataMessage);
        });
    }
    // eslint-disable-next-line
    joinMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(this.meeting)}&name=${encodeURIComponent(this.name)}&region=${encodeURIComponent(this.region)}`, {
                method: "POST",
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    endMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${DemoMeetingApp.BASE_URL}end?title=${encodeURIComponent(this.meeting)}`, {
                method: "POST",
            });
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAttendee(attendeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${DemoMeetingApp.BASE_URL}attendee?title=${encodeURIComponent(this.meeting)}&attendee=${encodeURIComponent(attendeeId)}`);
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    setupDeviceLabelTrigger() {
        // Note that device labels are privileged since they add to the
        // fingerprinting surface area of the browser session. In Chrome private
        // tabs and in all Firefox tabs, the labels can only be read once a
        // MediaStream is active. How to deal with this restriction depends on the
        // desired UX. The device controller includes an injectable device label
        // trigger which allows you to perform custom behavior in case there are no
        // labels, such as creating a temporary audio/video stream to unlock the
        // device names, which is the default behavior. Here we override the
        // trigger to also show an alert to let the user know that we are asking for
        // mic/camera permission.
        //
        // Also note that Firefox has its own device picker, which may be useful
        // for the first device selection. Subsequent device selections could use
        // a custom UX with a specific device id.
        this.audioVideo.setDeviceLabelTrigger(() => __awaiter(this, void 0, void 0, function* () {
            if (this.isRecorder() || this.isBroadcaster()) {
                throw new Error("Recorder or Broadcaster does not need device labels");
            }
            this.switchToFlow("flow-need-permission");
            const stream = yield navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            this.switchToFlow("flow-devices");
            return stream;
        }));
    }
    populateDeviceList(elementId, genericName, devices, additionalOptions) {
        const list = document.getElementById(elementId);
        while (list.firstElementChild) {
            list.removeChild(list.firstElementChild);
        }
        for (let i = 0; i < devices.length; i++) {
            const option = document.createElement("option");
            list.appendChild(option);
            option.text = devices[i].label || `${genericName} ${i + 1}`;
            option.value = devices[i].deviceId;
        }
        if (additionalOptions.length > 0) {
            const separator = document.createElement("option");
            separator.disabled = true;
            separator.text = "──────────";
            list.appendChild(separator);
            for (const additionalOption of additionalOptions) {
                const option = document.createElement("option");
                list.appendChild(option);
                option.text = additionalOption;
                option.value = additionalOption;
            }
        }
        if (!list.firstElementChild) {
            const option = document.createElement("option");
            option.text = "Device selection unavailable";
            list.appendChild(option);
        }
    }
    populateInMeetingDeviceList(elementId, genericName, devices, additionalOptions, additionalToggles, callback) {
        const menu = document.getElementById(elementId);
        while (menu.firstElementChild) {
            menu.removeChild(menu.firstElementChild);
        }
        for (let i = 0; i < devices.length; i++) {
            this.createDropdownMenuItem(menu, devices[i].label || `${genericName} ${i + 1}`, () => {
                callback(devices[i].deviceId);
            });
        }
        if (additionalOptions.length) {
            this.createDropdownMenuItem(menu, "──────────", () => { }).classList.add("text-center");
            for (const additionalOption of additionalOptions) {
                this.createDropdownMenuItem(menu, additionalOption, () => {
                    callback(additionalOption);
                }, `${elementId}-${additionalOption.replace(/\s/g, "-")}`);
            }
        }
        if (additionalToggles === null || additionalToggles === void 0 ? void 0 : additionalToggles.length) {
            this.createDropdownMenuItem(menu, "──────────", () => { }).classList.add("text-center");
            for (const { name, oncreate, action } of additionalToggles) {
                const id = `toggle-${elementId}-${name.replace(/\s/g, "-")}`;
                const elem = this.createDropdownMenuItem(menu, name, action, id);
                oncreate(elem);
            }
        }
        if (!menu.firstElementChild) {
            this.createDropdownMenuItem(menu, "Device selection unavailable", () => { });
        }
    }
    createDropdownMenuItem(menu, title, clickHandler, id) {
        const button = document.createElement("button");
        menu.appendChild(button);
        button.innerText = title;
        button.classList.add("dropdown-item");
        this.updateProperty(button, "id", id);
        button.addEventListener("click", () => {
            clickHandler();
        });
        return button;
    }
    populateAllDeviceLists() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.populateAudioInputList();
            yield this.populateVideoInputList();
            yield this.populateVideoFilterInputList();
            yield this.populateAudioOutputList();
        });
    }
    selectVideoFilterByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.selectedVideoFilterItem = name;
            this.log(`clicking video filter ${this.selectedVideoFilterItem}`);
            this.toggleButton("button-video-filter", this.selectedVideoFilterItem === "None" ? "off" : "on");
            if (this.isButtonOn("button-camera")) {
                try {
                    yield this.openVideoInputFromSelection(this.selectedVideoInput, false);
                }
                catch (err) {
                    fatal(err);
                    this.log("Failed to choose VideoTransformDevice", err);
                }
            }
        });
    }
    populateVideoFilterInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = "Filter";
            let filters = ["None"];
            if (this.defaultBrowserBehaviour.supportsCanvasCapturedStreamPlayback() &&
                this.enableUnifiedPlanForChromiumBasedBrowsers) {
                filters = filters.concat(VIDEO_FILTERS);
                if (SegmentationUtil_1.platformCanSupportBodyPixWithoutDegradation()) {
                    if (!this.loadingBodyPixDependencyPromise) {
                        this.loadingBodyPixDependencyPromise = SegmentationUtil_1.loadBodyPixDependency(this.loadingBodyPixDependencyTimeoutMs);
                    }
                    // do not use `await` to avoid blocking page loading
                    this.loadingBodyPixDependencyPromise
                        .then(() => {
                        filters.push("Segmentation");
                        this.populateInMeetingDeviceList("dropdown-menu-filter", genericName, [], filters, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                            yield this.selectVideoFilterByName(name);
                        }));
                    })
                        .catch((err) => {
                        this.log("Could not load BodyPix dependency", err);
                    });
                }
            }
            this.populateInMeetingDeviceList("dropdown-menu-filter", genericName, [], filters, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                yield this.selectVideoFilterByName(name);
            }));
        });
    }
    populateAudioInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = "Microphone";
            const additionalDevices = ["None", "440 Hz"];
            const additionalToggles = [];
            // This can't work unless Web Audio is enabled.
            if (this.enableWebAudio && this.supportsVoiceFocus) {
                additionalToggles.push({
                    name: "Amazon Voice Focus",
                    oncreate: (elem) => {
                        this.voiceFocusDisplayables.push(elem);
                    },
                    action: () => this.toggleVoiceFocusInMeeting(),
                });
            }
            this.populateDeviceList("audio-input", genericName, yield this.audioVideo.listAudioInputDevices(), additionalDevices);
            this.populateInMeetingDeviceList("dropdown-menu-microphone", genericName, yield this.audioVideo.listAudioInputDevices(), additionalDevices, additionalToggles, (name) => __awaiter(this, void 0, void 0, function* () {
                yield this.selectAudioInputDeviceByName(name);
            }));
        });
    }
    isVoiceFocusActive() {
        return this.currentAudioInputDevice instanceof amazon_chime_sdk_js_1.VoiceFocusTransformDevice;
    }
    updateVoiceFocusDisplayState() {
        const active = this.isVoiceFocusActive();
        this.log("Updating Amazon Voice Focus display state:", active);
        for (const elem of this.voiceFocusDisplayables) {
            elem.classList.toggle("vf-active", active);
        }
    }
    isVoiceFocusEnabled() {
        this.log("VF supported:", this.supportsVoiceFocus);
        this.log("VF enabled:", this.enableVoiceFocus);
        return this.supportsVoiceFocus && this.enableVoiceFocus;
    }
    reselectAudioInputDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const current = this.currentAudioInputDevice;
            if (current instanceof amazon_chime_sdk_js_1.VoiceFocusTransformDevice) {
                // Unwrap and rewrap if Amazon Voice Focus is selected.
                const intrinsic = current.getInnerDevice();
                const device = yield this.audioInputSelectionWithOptionalVoiceFocus(intrinsic);
                return this.selectAudioInputDevice(device);
            }
            // If it's another kind of transform device, just reselect it.
            if (amazon_chime_sdk_js_1.isAudioTransformDevice(current)) {
                return this.selectAudioInputDevice(current);
            }
            // Otherwise, apply Amazon Voice Focus if needed.
            const device = yield this.audioInputSelectionWithOptionalVoiceFocus(current);
            return this.selectAudioInputDevice(device);
        });
    }
    toggleVoiceFocusInMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            const elem = document.getElementById("add-voice-focus");
            this.enableVoiceFocus = this.supportsVoiceFocus && !this.enableVoiceFocus;
            elem.checked = this.enableVoiceFocus;
            this.log("Amazon Voice Focus toggle is now", elem.checked);
            yield this.reselectAudioInputDevice();
        });
    }
    populateVideoInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = "Camera";
            const additionalDevices = ["None", "Blue", "SMPTE Color Bars"];
            this.populateDeviceList("video-input", genericName, yield this.audioVideo.listVideoInputDevices(), additionalDevices);
            this.populateInMeetingDeviceList("dropdown-menu-camera", genericName, yield this.audioVideo.listVideoInputDevices(), additionalDevices, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.openVideoInputFromSelection(name, false);
                }
                catch (err) {
                    fatal(err);
                    this.log("no video input device selected");
                }
            }));
            const cameras = yield this.audioVideo.listVideoInputDevices();
            this.cameraDeviceIds = cameras.map((deviceInfo) => {
                return deviceInfo.deviceId;
            });
        });
    }
    populateAudioOutputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const supportsChoosing = this.defaultBrowserBehaviour.supportsSetSinkId();
            const genericName = "Speaker";
            const additionalDevices = [];
            const devices = supportsChoosing
                ? yield this.audioVideo.listAudioOutputDevices()
                : [];
            this.populateDeviceList("audio-output", genericName, devices, additionalDevices);
            this.populateInMeetingDeviceList("dropdown-menu-speaker", genericName, devices, additionalDevices, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                if (!supportsChoosing) {
                    return;
                }
                try {
                    yield this.chooseAudioOutputDevice(name);
                }
                catch (e) {
                    fatal(e);
                    this.log("Failed to chooseAudioOutputDevice", e);
                }
            }));
        });
    }
    chooseAudioOutputDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set it for the content share stream if we can.
            const videoElem = document.getElementById("content-share-video");
            if (this.defaultBrowserBehaviour.supportsSetSinkId()) {
                // @ts-ignore
                videoElem.setSinkId(device);
            }
            yield this.audioVideo.chooseAudioOutputDevice(device);
        });
    }
    selectedAudioInput() {
        return __awaiter(this, void 0, void 0, function* () {
            const audioInput = document.getElementById("audio-input");
            const device = yield this.audioInputSelectionToDevice(audioInput.value);
            return device;
        });
    }
    selectAudioInputDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentAudioInputDevice = device;
            this.log("Selecting audio input", device);
            try {
                yield this.audioVideo.chooseAudioInputDevice(device);
            }
            catch (e) {
                fatal(e);
                this.log(`failed to choose audio input device ${device}`, e);
            }
            this.updateVoiceFocusDisplayState();
        });
    }
    selectAudioInputDeviceByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("Selecting audio input device by name:", name);
            const device = yield this.audioInputSelectionToDevice(name);
            return this.selectAudioInputDevice(device);
        });
    }
    openAudioInputFromSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            const device = yield this.selectedAudioInput();
            yield this.selectAudioInputDevice(device);
        });
    }
    openAudioInputFromSelectionAndPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stopAudioPreview();
            yield this.openAudioInputFromSelection();
            this.log("Starting audio preview.");
            yield this.startAudioPreview();
        });
    }
    setAudioPreviewPercent(percent) {
        const audioPreview = document.getElementById("audio-preview");
        if (!audioPreview) {
            return;
        }
        this.updateProperty(audioPreview.style, "transitionDuration", "33ms");
        this.updateProperty(audioPreview.style, "width", `${percent}%`);
        if (audioPreview.getAttribute("aria-valuenow") !== `${percent}`) {
            audioPreview.setAttribute("aria-valuenow", `${percent}`);
        }
    }
    stopAudioPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.analyserNode) {
                return;
            }
            this.analyserNodeCallback = undefined;
            // Disconnect the analyser node from its inputs and outputs.
            this.analyserNode.disconnect();
            this.analyserNode.removeOriginalInputs();
            this.analyserNode = undefined;
        });
    }
    startAudioPreview() {
        this.setAudioPreviewPercent(0);
        // Recreate.
        if (this.analyserNode) {
            // Disconnect the analyser node from its inputs and outputs.
            this.analyserNode.disconnect();
            this.analyserNode.removeOriginalInputs();
            this.analyserNode = undefined;
        }
        const analyserNode = this.audioVideo.createAnalyserNodeForAudioInput();
        if (!analyserNode) {
            return;
        }
        if (!analyserNode.getByteTimeDomainData) {
            document.getElementById("audio-preview").parentElement.style.visibility =
                "hidden";
            return;
        }
        this.analyserNode = analyserNode;
        const data = new Uint8Array(analyserNode.fftSize);
        let frameIndex = 0;
        this.analyserNodeCallback = () => {
            if (frameIndex === 0) {
                analyserNode.getByteTimeDomainData(data);
                const lowest = 0.01;
                let max = lowest;
                for (const f of data) {
                    max = Math.max(max, (f - 128) / 128);
                }
                let normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
                let percent = Math.min(Math.max(normalized * 100, 0), 100);
                this.setAudioPreviewPercent(percent);
            }
            frameIndex = (frameIndex + 1) % 2;
            if (this.analyserNodeCallback) {
                requestAnimationFrame(this.analyserNodeCallback);
            }
        };
        requestAnimationFrame(this.analyserNodeCallback);
    }
    openAudioOutputFromSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.defaultBrowserBehaviour.supportsSetSinkId()) {
                try {
                    const audioOutput = document.getElementById("audio-output");
                    yield this.chooseAudioOutputDevice(audioOutput.value);
                }
                catch (e) {
                    fatal(e);
                    this.log("failed to chooseAudioOutputDevice", e);
                }
            }
            const audioMix = document.getElementById("meeting-audio");
            try {
                yield this.audioVideo.bindAudioElement(audioMix);
            }
            catch (e) {
                fatal(e);
                this.log("failed to bindAudioElement", e);
            }
        });
    }
    openVideoInputFromSelection(selection, showPreview) {
        return __awaiter(this, void 0, void 0, function* () {
            if (selection) {
                this.selectedVideoInput = selection;
            }
            this.log(`Switching to: ${this.selectedVideoInput}`);
            const device = yield this.videoInputSelectionToDevice(this.selectedVideoInput);
            if (device === null) {
                if (showPreview) {
                    this.audioVideo.stopVideoPreviewForVideoInput(document.getElementById("video-preview"));
                }
                this.audioVideo.stopLocalVideoTile();
                this.toggleButton("button-camera", "off");
                // choose video input null is redundant since we expect stopLocalVideoTile to clean up
                try {
                    yield this.audioVideo.chooseVideoInputDevice(device);
                }
                catch (e) {
                    fatal(e);
                    this.log(`failed to chooseVideoInputDevice ${device}`, e);
                }
                throw new Error("no video device selected");
            }
            try {
                yield this.audioVideo.chooseVideoInputDevice(device);
            }
            catch (e) {
                fatal(e);
                this.log(`failed to chooseVideoInputDevice ${device}`, e);
            }
            if (showPreview) {
                this.audioVideo.startVideoPreviewForVideoInput(document.getElementById("video-preview"));
            }
        });
    }
    audioInputSelectionToIntrinsicDevice(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRecorder() || this.isBroadcaster()) {
                return null;
            }
            if (value === "440 Hz") {
                return amazon_chime_sdk_js_1.DefaultDeviceController.synthesizeAudioDevice(440);
            }
            if (value === "None") {
                return null;
            }
            return value;
        });
    }
    getVoiceFocusDeviceTransformer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.voiceFocusTransformer) {
                return this.voiceFocusTransformer;
            }
            const logger = new amazon_chime_sdk_js_1.ConsoleLogger("SDK", amazon_chime_sdk_js_1.LogLevel.DEBUG);
            const transformer = yield amazon_chime_sdk_js_1.VoiceFocusDeviceTransformer.create(VOICE_FOCUS_SPEC, { logger });
            this.voiceFocusTransformer = transformer;
            return transformer;
        });
    }
    createVoiceFocusDevice(inner) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.supportsVoiceFocus) {
                return inner;
            }
            if (this.voiceFocusDevice) {
                // Dismantle the old one.
                return (this.voiceFocusDevice = yield this.voiceFocusDevice.chooseNewInnerDevice(inner));
            }
            try {
                const transformer = yield this.getVoiceFocusDeviceTransformer();
                const vf = yield transformer.createTransformDevice(inner);
                if (vf) {
                    return (this.voiceFocusDevice = vf);
                }
            }
            catch (e) {
                // Fall through.
            }
            return inner;
        });
    }
    audioInputSelectionWithOptionalVoiceFocus(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isVoiceFocusEnabled()) {
                if (!this.voiceFocusDevice) {
                    return this.createVoiceFocusDevice(device);
                }
                // Switch out the inner if needed.
                // The reuse of the Voice Focus device is more efficient, particularly if
                // reselecting the same inner -- no need to modify the Web Audio graph.
                // Allowing the Voice Focus device to manage toggling Voice Focus on and off
                // also
                return (this.voiceFocusDevice = yield this.voiceFocusDevice.chooseNewInnerDevice(device));
            }
            return device;
        });
    }
    audioInputSelectionToDevice(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const inner = yield this.audioInputSelectionToIntrinsicDevice(value);
            return this.audioInputSelectionWithOptionalVoiceFocus(inner);
        });
    }
    videoInputSelectionToIntrinsicDevice(value) {
        if (value === "Blue") {
            return amazon_chime_sdk_js_1.DefaultDeviceController.synthesizeVideoDevice("blue");
        }
        if (value === "SMPTE Color Bars") {
            return amazon_chime_sdk_js_1.DefaultDeviceController.synthesizeVideoDevice("smpte");
        }
        return value;
    }
    videoFilterToProcessor(videoFilter) {
        this.log(`Choosing video filter ${videoFilter}`);
        if (videoFilter === "Emojify") {
            return new EmojifyVideoFrameProcessor_1.default("🚀");
        }
        if (videoFilter === "CircularCut") {
            return new CircularCut_1.default();
        }
        if (videoFilter === "NoOp") {
            return new amazon_chime_sdk_js_1.NoOpVideoFrameProcessor();
        }
        if (videoFilter === "Segmentation") {
            return new SegmentationProcessor_1.default();
        }
        return null;
    }
    videoInputSelectionWithOptionalFilter(innerDevice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.selectedVideoFilterItem === "None") {
                return innerDevice;
            }
            if (this.chosenVideoTransformDevice &&
                this.selectedVideoFilterItem === this.chosenVideoFilter) {
                if (this.chosenVideoTransformDevice.getInnerDevice() !== innerDevice) {
                    // switching device
                    this.chosenVideoTransformDevice = this.chosenVideoTransformDevice.chooseNewInnerDevice(innerDevice);
                }
                return this.chosenVideoTransformDevice;
            }
            // A different processor is selected then we need to discard old one and recreate
            if (this.chosenVideoTransformDevice) {
                yield this.chosenVideoTransformDevice.stop();
            }
            const proc = this.videoFilterToProcessor(this.selectedVideoFilterItem);
            this.chosenVideoFilter = this.selectedVideoFilterItem;
            this.chosenVideoTransformDevice = new amazon_chime_sdk_js_1.DefaultVideoTransformDevice(this.meetingLogger, innerDevice, [proc]);
            return this.chosenVideoTransformDevice;
        });
    }
    videoInputSelectionToDevice(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRecorder() || this.isBroadcaster() || value === "None") {
                return null;
            }
            const intrinsicDevice = this.videoInputSelectionToIntrinsicDevice(value);
            return yield this.videoInputSelectionWithOptionalFilter(intrinsicDevice);
        });
    }
    initContentShareDropDownItems() {
        let item = document.getElementById("dropdown-item-content-share-screen-capture");
        item.addEventListener("click", () => {
            this.contentShareType = ContentShareType.ScreenCapture;
            this.contentShareStart();
        });
        item = document.getElementById("dropdown-item-content-share-screen-test-video");
        item.addEventListener("click", () => {
            this.contentShareType = ContentShareType.VideoFile;
            this.contentShareStart(DemoMeetingApp.testVideo);
        });
        document
            .getElementById("content-share-item")
            .addEventListener("change", () => {
            const fileList = document.getElementById("content-share-item");
            const file = fileList.files[0];
            if (!file) {
                this.log("no content share selected");
                return;
            }
            const url = URL.createObjectURL(file);
            this.log(`content share selected: ${url}`);
            this.contentShareType = ContentShareType.VideoFile;
            this.contentShareStart(url);
            fileList.value = "";
            document.getElementById("dropdown-item-content-share-file-item").click();
        });
        document
            .getElementById("dropdown-item-content-share-stop")
            .addEventListener("click", () => {
            this.contentShareStop();
        });
    }
    playToStream(videoFile) {
        return __awaiter(this, void 0, void 0, function* () {
            yield videoFile.play();
            if (this.defaultBrowserBehaviour.hasFirefoxWebRTC()) {
                // @ts-ignore
                return videoFile.mozCaptureStream();
            }
            // @ts-ignore
            return videoFile.captureStream();
        });
    }
    contentShareStart(videoUrl) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.contentShareType) {
                case ContentShareType.ScreenCapture: {
                    try {
                        yield this.audioVideo.startContentShareFromScreenCapture();
                    }
                    catch (e) {
                        (_a = this.meetingLogger) === null || _a === void 0 ? void 0 : _a.error(`Could not start content share: ${e}`);
                        return;
                    }
                    break;
                }
                case ContentShareType.VideoFile: {
                    const videoFile = document.getElementById("content-share-video");
                    if (videoUrl) {
                        videoFile.src = videoUrl;
                    }
                    const mediaStream = yield this.playToStream(videoFile);
                    try {
                        // getDisplayMedia can throw.
                        yield this.audioVideo.startContentShare(mediaStream);
                    }
                    catch (e) {
                        (_b = this.meetingLogger) === null || _b === void 0 ? void 0 : _b.error(`Could not start content share: ${e}`);
                        return;
                    }
                    break;
                }
            }
            this.toggleButton("button-content-share", "on");
            this.updateContentShareDropdown(true);
        });
    }
    contentShareStop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.audioVideo.stopContentShare();
            this.toggleButton("button-pause-content-share", "off");
            this.toggleButton("button-content-share", "off");
            this.updateContentShareDropdown(false);
            if (this.contentShareType === ContentShareType.VideoFile) {
                const videoFile = document.getElementById("content-share-video");
                videoFile.pause();
                videoFile.style.display = "none";
            }
        });
    }
    updateContentShareDropdown(enabled) {
        document.getElementById("dropdown-item-content-share-screen-capture").style.display = enabled ? "none" : "block";
        document.getElementById("dropdown-item-content-share-screen-test-video").style.display = enabled ? "none" : "block";
        document.getElementById("dropdown-item-content-share-file-item").style.display = enabled ? "none" : "block";
        document.getElementById("dropdown-item-content-share-stop").style.display = enabled ? "block" : "none";
    }
    isRecorder() {
        return new URL(window.location.href).searchParams.get("record") === "true";
    }
    isBroadcaster() {
        return (new URL(window.location.href).searchParams.get("broadcast") === "true");
    }
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            const joinInfo = (yield this.joinMeeting()).JoinInfo;
            const configuration = new amazon_chime_sdk_js_1.MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
            yield this.initializeMeetingSession(configuration);
            const url = new URL(window.location.href);
            url.searchParams.set("m", this.meeting);
            history.replaceState({}, `${this.meeting}`, url.toString());
            return configuration.meetingId;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log(str, ...args) {
        console.log.apply(console, [`[DEMO] ${str}`, ...args]);
    }
    audioVideoDidStartConnecting(reconnecting) {
        this.log(`session connecting. reconnecting: ${reconnecting}`);
    }
    audioVideoDidStart() {
        this.log("session started");
    }
    audioVideoDidStop(sessionStatus) {
        this.log(`session stopped from ${JSON.stringify(sessionStatus)}`);
        this.log(`resetting stats in WebRTCStatsCollector`);
        this.statsCollector.resetStats();
        const returnToStart = () => {
            switch (this.behaviorAfterLeave) {
                case "spa":
                    this.switchToFlow("flow-authenticate");
                    break;
                case "reload":
                    window.location.href = window.location.pathname;
                    break;
                // This is useful for testing memory leaks.
                case "halt": {
                    // Wait a moment to make sure cleanup is done.
                    setTimeout(() => {
                        // Kill all references to code and content.
                        // @ts-ignore
                        window.app = undefined;
                        // @ts-ignore
                        window.app_meetingV2 = undefined;
                        // @ts-ignore
                        window.webpackHotUpdateapp_meetingV2 = undefined;
                        document.getElementsByTagName("body")[0].innerHTML = "<b>Gone</b>";
                        this.removeFatalHandlers();
                    }, 2000);
                    break;
                }
            }
        };
        /**
         * This is approximately the inverse of the initialization method above.
         * This work only needs to be done if you want to continue using the page; if
         * your app navigates away or closes the tab when done, you can let the browser
         * clean up.
         */
        const cleanUpResources = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Clean up the timers for this.
            this.audioVideo.unsubscribeFromActiveSpeakerDetector(this.activeSpeakerHandler);
            // Stop listening to attendee presence.
            this.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);
            // Stop watching device changes in the UI.
            this.audioVideo.removeDeviceChangeObserver(this);
            // Stop content share and local video.
            yield this.audioVideo.stopLocalVideoTile();
            yield this.audioVideo.stopContentShare();
            // Drop the audio output.
            yield this.audioVideo.chooseAudioOutputDevice(null);
            this.audioVideo.unbindAudioElement();
            // Stop any video processor.
            yield ((_a = this.chosenVideoTransformDevice) === null || _a === void 0 ? void 0 : _a.stop());
            // Stop Voice Focus.
            yield ((_b = this.voiceFocusDevice) === null || _b === void 0 ? void 0 : _b.stop());
            // If you joined and left the meeting, `CleanStoppedSessionTask` will have deselected
            // any input streams. If you didn't, you need to call `chooseAudioInputDevice` here.
            // Clean up the loggers so they don't keep their `onload` listeners around.
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                var _c, _d;
                yield ((_c = this.meetingEventPOSTLogger) === null || _c === void 0 ? void 0 : _c.destroy());
                yield ((_d = this.meetingSessionPOSTLogger) === null || _d === void 0 ? void 0 : _d.destroy());
            }), 500);
            this.audioVideo = undefined;
            this.voiceFocusDevice = undefined;
            this.meetingSession = undefined;
            this.activeSpeakerHandler = undefined;
            this.currentAudioInputDevice = undefined;
        });
        const onLeftMeeting = () => __awaiter(this, void 0, void 0, function* () {
            yield cleanUpResources();
            returnToStart();
        });
        if (sessionStatus.statusCode() === amazon_chime_sdk_js_1.MeetingSessionStatusCode.AudioCallEnded) {
            this.log(`meeting ended`);
            onLeftMeeting();
            return;
        }
        if (sessionStatus.statusCode() === amazon_chime_sdk_js_1.MeetingSessionStatusCode.Left) {
            this.log("left meeting");
            onLeftMeeting();
            return;
        }
    }
    createPauseResumeListener(tileState) {
        return (event) => {
            if (!tileState.paused) {
                this.audioVideo.pauseVideoTile(tileState.tileId);
                event.target.innerText = "Resume";
            }
            else {
                this.audioVideo.unpauseVideoTile(tileState.tileId);
                event.target.innerText = "Pause";
            }
        };
    }
    videoTileDidUpdate(tileState) {
        this.log(`video tile updated: ${JSON.stringify(tileState, null, "  ")}`);
        if (!tileState.boundAttendeeId) {
            return;
        }
        const tileIndex = tileState.localTile
            ? 16
            : this.tileOrganizer.acquireTileIndex(tileState.tileId);
        const tileElement = document.getElementById(`tile-${tileIndex}`);
        const videoElement = document.getElementById(`video-${tileIndex}`);
        const nameplateElement = document.getElementById(`nameplate-${tileIndex}`);
        const attendeeIdElement = document.getElementById(`attendeeid-${tileIndex}`);
        const pauseButtonElement = document.getElementById(`video-pause-${tileIndex}`);
        pauseButtonElement.removeEventListener("click", this.tileIndexToPauseEventListener[tileIndex]);
        this.tileIndexToPauseEventListener[tileIndex] = this.createPauseResumeListener(tileState);
        pauseButtonElement.addEventListener("click", this.tileIndexToPauseEventListener[tileIndex]);
        this.log(`binding video tile ${tileState.tileId} to ${videoElement.id}`);
        this.audioVideo.bindVideoElement(tileState.tileId, videoElement);
        this.tileIndexToTileId[tileIndex] = tileState.tileId;
        this.tileIdToTileIndex[tileState.tileId] = tileIndex;
        this.updateProperty(nameplateElement, "innerText", tileState.boundExternalUserId.split("#")[1]);
        this.updateProperty(attendeeIdElement, "innerText", tileState.boundAttendeeId);
        this.showTile(tileElement, tileState);
        this.updateGridClasses();
        this.layoutFeaturedTile();
    }
    videoTileWasRemoved(tileId) {
        const tileIndex = this.tileOrganizer.releaseTileIndex(tileId);
        this.log(`video tileId removed: ${tileId} from tile-${tileIndex}`);
        this.hideTile(tileIndex);
        this.updateGridClasses();
    }
    videoAvailabilityDidChange(availability) {
        this.canStartLocalVideo = availability.canStartLocalVideo;
        this.log(`video availability changed: canStartLocalVideo  ${availability.canStartLocalVideo}`);
    }
    showTile(tileElement, tileState) {
        tileElement.classList.add(`active`);
        if (tileState.isContent) {
            tileElement.classList.add("content");
        }
    }
    hideTile(tileIndex) {
        const tileElement = document.getElementById(`tile-${tileIndex}`);
        tileElement.classList.remove("active", "featured", "content");
    }
    tileIdForAttendeeId(attendeeId) {
        for (const tile of this.audioVideo.getAllVideoTiles()) {
            const state = tile.state();
            if (state.boundAttendeeId === attendeeId) {
                return state.tileId;
            }
        }
        return null;
    }
    findContentTileId() {
        for (const tile of this.audioVideo.getAllVideoTiles()) {
            const state = tile.state();
            if (state.isContent) {
                return state.tileId;
            }
        }
        return null;
    }
    activeTileId() {
        let contentTileId = this.findContentTileId();
        if (contentTileId !== null) {
            return contentTileId;
        }
        for (const attendeeId in this.roster) {
            if (this.roster[attendeeId].active) {
                return this.tileIdForAttendeeId(attendeeId);
            }
        }
        return null;
    }
    layoutFeaturedTile() {
        if (!this.meetingSession) {
            return;
        }
        const tilesIndices = this.visibleTileIndices();
        const localTileId = this.localTileId();
        const activeTile = this.activeTileId();
        for (let i = 0; i < tilesIndices.length; i++) {
            const tileIndex = tilesIndices[i];
            const tileElement = document.getElementById(`tile-${tileIndex}`);
            const tileId = this.tileIndexToTileId[tileIndex];
            if (tileId === activeTile && tileId !== localTileId) {
                tileElement.classList.add("featured");
            }
            else {
                tileElement.classList.remove("featured");
            }
        }
        this.updateGridClasses();
    }
    updateGridClasses() {
        const localTileId = this.localTileId();
        const activeTile = this.activeTileId();
        this.tileArea.className = `v-grid size-${this.availablelTileSize()}`;
        if (activeTile && activeTile !== localTileId) {
            this.tileArea.classList.add("featured");
        }
        else {
            this.tileArea.classList.remove("featured");
        }
    }
    availablelTileSize() {
        return (this.tileOrganizer.remoteTileCount +
            (this.audioVideo.hasStartedLocalVideoTile() ? 1 : 0));
    }
    localTileId() {
        return this.audioVideo.hasStartedLocalVideoTile()
            ? this.audioVideo.getLocalVideoTile().state().tileId
            : null;
    }
    visibleTileIndices() {
        const tileKeys = Object.keys(this.tileOrganizer.tiles);
        const tiles = tileKeys.map((tileId) => parseInt(tileId));
        return tiles;
    }
    setUpVideoTileElementResizer() {
        for (let i = 0; i <= DemoTileOrganizer.MAX_TILES; i++) {
            const videoElem = document.getElementById(`video-${i}`);
            videoElem.onresize = () => {
                if (videoElem.videoHeight > videoElem.videoWidth) {
                    // portrait mode
                    videoElem.style.objectFit = "contain";
                    this.log(`video-${i} changed to portrait mode resolution ${videoElem.videoWidth}x${videoElem.videoHeight}`);
                }
                else {
                    videoElem.style.objectFit = "cover";
                }
            };
        }
    }
    allowMaxContentShare() {
        const allowed = new URL(window.location.href).searchParams.get("max-content-share") ===
            "true";
        if (allowed) {
            return true;
        }
        return false;
    }
    connectionDidBecomePoor() {
        this.log("connection is poor");
    }
    connectionDidSuggestStopVideo() {
        this.log("suggest turning the video off");
    }
    connectionDidBecomeGood() {
        this.log("connection is good now");
    }
    videoSendDidBecomeUnavailable() {
        this.log("sending video is not available");
    }
    contentShareDidStart() {
        this.log("content share started.");
    }
    contentShareDidStop() {
        this.log("content share stopped.");
        if (this.isButtonOn("button-content-share")) {
            this.buttonStates["button-content-share"] = false;
            this.buttonStates["button-pause-content-share"] = false;
            this.displayButtonStates();
            this.updateContentShareDropdown(false);
        }
    }
    contentShareDidPause() {
        this.log("content share paused.");
    }
    contentShareDidUnpause() {
        this.log(`content share unpaused.`);
    }
    encodingSimulcastLayersDidChange(simulcastLayers) {
        this.log(`current active simulcast layers changed to: ${SimulcastLayerMapping[simulcastLayers]}`);
    }
    remoteVideoSourcesDidChange(videoSources) {
        this.log(`available remote video sources changed: ${JSON.stringify(videoSources)}`);
    }
}
exports.DemoMeetingApp = DemoMeetingApp;
DemoMeetingApp.DID = "+17035550122";
DemoMeetingApp.BASE_URL = [
    location.protocol,
    "//",
    location.host,
    location.pathname.replace(/\/*$/, "/").replace("/v2", ""),
].join("");
DemoMeetingApp.testVideo = "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm";
DemoMeetingApp.LOGGER_BATCH_SIZE = 85;
DemoMeetingApp.LOGGER_INTERVAL_MS = 2000;
DemoMeetingApp.MAX_MEETING_HISTORY_MS = 5 * 60 * 1000;
DemoMeetingApp.DATA_MESSAGE_TOPIC = "chat";
DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS = 300000;
window.addEventListener("load", () => {
    new DemoMeetingApp();
});
//# sourceMappingURL=meetingV2.js.map