import { AudioInputDevice, AudioVideoFacade, AudioVideoObserver, ClientMetricReport, ClientVideoStreamReceivingReport, ContentShareObserver, DataMessage, DefaultBrowserBehavior, DefaultVideoTransformDevice, DeviceChangeObserver, EventAttributes, EventName, Logger, MeetingSession, MeetingSessionConfiguration, MeetingSessionPOSTLogger, MeetingSessionStatus, MeetingSessionVideoAvailability, RemovableAnalyserNode, SimulcastLayers, VideoSource, VideoTileState, VoiceFocusDeviceTransformer, VoiceFocusTransformDevice } from "amazon-chime-sdk-js";
import "bootstrap";
import "./styleV2.scss";
import WebRTCStatsCollector from "./webrtcstatscollector/WebRTCStatsCollector";
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}
declare class DemoTileOrganizer {
    static MAX_TILES: number;
    tiles: {
        [id: number]: number;
    };
    tileStates: {
        [id: number]: boolean;
    };
    remoteTileCount: number;
    acquireTileIndex(tileId: number): number;
    releaseTileIndex(tileId: number): number;
}
declare type VideoFilterName = "Emojify" | "CircularCut" | "NoOp" | "Segmentation" | "None";
export declare enum ContentShareType {
    ScreenCapture = 0,
    VideoFile = 1
}
interface Toggle {
    name: string;
    oncreate: (elem: HTMLElement) => void;
    action: () => void;
}
export declare class DemoMeetingApp implements AudioVideoObserver, DeviceChangeObserver, ContentShareObserver {
    static readonly DID: string;
    static readonly BASE_URL: string;
    static testVideo: string;
    static readonly LOGGER_BATCH_SIZE: number;
    static readonly LOGGER_INTERVAL_MS: number;
    static readonly MAX_MEETING_HISTORY_MS: number;
    static readonly DATA_MESSAGE_TOPIC: string;
    static readonly DATA_MESSAGE_LIFETIME_MS: number;
    loadingBodyPixDependencyTimeoutMs: number;
    loadingBodyPixDependencyPromise: undefined | Promise<void>;
    attendeeIdPresenceHandler: undefined | ((attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => void);
    activeSpeakerHandler: undefined | ((attendeeIds: string[]) => void);
    showActiveSpeakerScores: boolean;
    activeSpeakerLayout: boolean;
    meeting: string | null;
    name: string | null;
    voiceConnectorId: string | null;
    sipURI: string | null;
    region: string | null;
    meetingSession: MeetingSession | null;
    audioVideo: AudioVideoFacade | null;
    tileOrganizer: DemoTileOrganizer;
    canStartLocalVideo: boolean;
    defaultBrowserBehaviour: DefaultBrowserBehavior;
    roster: any;
    tileIndexToTileId: {
        [id: number]: number;
    };
    tileIdToTileIndex: {
        [id: number]: number;
    };
    tileIndexToPauseEventListener: {
        [id: number]: (event: Event) => void;
    };
    tileArea: HTMLDivElement;
    cameraDeviceIds: string[];
    microphoneDeviceIds: string[];
    currentAudioInputDevice: AudioInputDevice | undefined;
    buttonStates: {
        [key: string]: boolean;
    };
    contentShareType: ContentShareType;
    enableWebAudio: boolean;
    enableUnifiedPlanForChromiumBasedBrowsers: boolean;
    enableSimulcast: boolean;
    supportsVoiceFocus: boolean;
    enableVoiceFocus: boolean;
    voiceFocusIsActive: boolean;
    markdown: any;
    lastMessageSender: string | null;
    lastReceivedMessageTimestamp: number;
    meetingSessionPOSTLogger: MeetingSessionPOSTLogger;
    meetingEventPOSTLogger: MeetingSessionPOSTLogger;
    hasChromiumWebRTC: boolean;
    statsCollector: WebRTCStatsCollector;
    voiceFocusTransformer: VoiceFocusDeviceTransformer | undefined;
    voiceFocusDevice: VoiceFocusTransformDevice | undefined;
    voiceFocusDisplayables: HTMLElement[];
    analyserNode: RemovableAnalyserNode;
    chosenVideoTransformDevice: DefaultVideoTransformDevice;
    chosenVideoFilter: VideoFilterName;
    selectedVideoFilterItem: VideoFilterName;
    meetingLogger: Logger | undefined;
    behaviorAfterLeave: "spa" | "reload" | "halt";
    removeFatalHandlers: () => void;
    addFatalHandlers(): void;
    constructor();
    /**
     * We want to make it abundantly clear at development and testing time
     * when an unexpected error occurs.
     * If we're running locally, or we passed a `fatal=1` query parameter, fail hard.
     */
    fatal(e: Error | string): void;
    initParameters(): void;
    initVoiceFocus(): Promise<void>;
    private onVoiceFocusSettingChanged;
    initEventListeners(): void;
    logPPS(): void;
    getSupportedMediaRegions(): string[];
    getNearestMediaRegion(): Promise<string>;
    setMediaRegion(): void;
    toggleButton(button: string, state?: "on" | "off"): boolean;
    isButtonOn(button: string): boolean;
    displayButtonStates(): void;
    showProgress(id: string): void;
    hideProgress(id: string): void;
    switchToFlow(flow: string): void;
    onAudioInputsChanged(freshDevices: MediaDeviceInfo[]): Promise<void>;
    audioInputsChanged(freshAudioInputDeviceList: MediaDeviceInfo[]): void;
    videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void;
    audioOutputsChanged(_freshAudioOutputDeviceList: MediaDeviceInfo[]): void;
    audioInputStreamEnded(deviceId: string): void;
    videoInputStreamEnded(deviceId: string): void;
    estimatedDownlinkBandwidthLessThanRequired(estimatedDownlinkBandwidthKbps: number, requiredVideoDownlinkBandwidthKbps: number): void;
    videoNotReceivingEnoughData(videoReceivingReports: ClientVideoStreamReceivingReport[]): void;
    metricsDidReceive(clientMetricReport: ClientMetricReport): void;
    getAndShowWebRTCStats(): void;
    getRelayProtocol(): Promise<void>;
    getStats(tileIndex: number): Promise<void>;
    createLogStream(configuration: MeetingSessionConfiguration, pathname: string): Promise<void>;
    eventDidReceive(name: EventName, attributes: EventAttributes): void;
    initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void>;
    join(): Promise<void>;
    leave(): Promise<void>;
    setupMuteHandler(): void;
    setupCanUnmuteHandler(): void;
    updateRoster(): void;
    updateProperty(obj: any, key: string, value: string): void;
    setupSubscribeToAttendeeIdPresenceHandler(): void;
    getStatsForOutbound(id: string): Promise<void>;
    dataMessageHandler(dataMessage: DataMessage): void;
    setupDataMessage(): void;
    joinMeeting(): Promise<any>;
    endMeeting(): Promise<any>;
    getAttendee(attendeeId: string): Promise<any>;
    setupDeviceLabelTrigger(): void;
    populateDeviceList(elementId: string, genericName: string, devices: MediaDeviceInfo[], additionalOptions: string[]): void;
    populateInMeetingDeviceList(elementId: string, genericName: string, devices: MediaDeviceInfo[], additionalOptions: string[], additionalToggles: Toggle[] | undefined, callback: (name: string) => void): void;
    createDropdownMenuItem(menu: HTMLDivElement, title: string, clickHandler: () => void, id?: string): HTMLButtonElement;
    populateAllDeviceLists(): Promise<void>;
    private selectVideoFilterByName;
    private populateVideoFilterInputList;
    populateAudioInputList(): Promise<void>;
    private isVoiceFocusActive;
    private updateVoiceFocusDisplayState;
    private isVoiceFocusEnabled;
    private reselectAudioInputDevice;
    private toggleVoiceFocusInMeeting;
    populateVideoInputList(): Promise<void>;
    populateAudioOutputList(): Promise<void>;
    private chooseAudioOutputDevice;
    private analyserNodeCallback;
    selectedAudioInput(): Promise<AudioInputDevice>;
    selectAudioInputDevice(device: AudioInputDevice): Promise<void>;
    selectAudioInputDeviceByName(name: string): Promise<void>;
    openAudioInputFromSelection(): Promise<void>;
    openAudioInputFromSelectionAndPreview(): Promise<void>;
    setAudioPreviewPercent(percent: number): void;
    stopAudioPreview(): Promise<void>;
    startAudioPreview(): void;
    openAudioOutputFromSelection(): Promise<void>;
    private selectedVideoInput;
    openVideoInputFromSelection(selection: string | null, showPreview: boolean): Promise<void>;
    private audioInputSelectionToIntrinsicDevice;
    private getVoiceFocusDeviceTransformer;
    private createVoiceFocusDevice;
    private audioInputSelectionWithOptionalVoiceFocus;
    private audioInputSelectionToDevice;
    private videoInputSelectionToIntrinsicDevice;
    private videoFilterToProcessor;
    private videoInputSelectionWithOptionalFilter;
    private videoInputSelectionToDevice;
    private initContentShareDropDownItems;
    private playToStream;
    private contentShareStart;
    private contentShareStop;
    private updateContentShareDropdown;
    isRecorder(): boolean;
    isBroadcaster(): boolean;
    authenticate(): Promise<string>;
    log(str: string, ...args: any[]): void;
    audioVideoDidStartConnecting(reconnecting: boolean): void;
    audioVideoDidStart(): void;
    audioVideoDidStop(sessionStatus: MeetingSessionStatus): void;
    createPauseResumeListener(tileState: VideoTileState): (event: Event) => void;
    videoTileDidUpdate(tileState: VideoTileState): void;
    videoTileWasRemoved(tileId: number): void;
    videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void;
    showTile(tileElement: HTMLDivElement, tileState: VideoTileState): void;
    hideTile(tileIndex: number): void;
    tileIdForAttendeeId(attendeeId: string): number | null;
    findContentTileId(): number | null;
    activeTileId(): number | null;
    layoutFeaturedTile(): void;
    updateGridClasses(): void;
    availablelTileSize(): number;
    localTileId(): number | null;
    visibleTileIndices(): number[];
    setUpVideoTileElementResizer(): void;
    allowMaxContentShare(): boolean;
    connectionDidBecomePoor(): void;
    connectionDidSuggestStopVideo(): void;
    connectionDidBecomeGood(): void;
    videoSendDidBecomeUnavailable(): void;
    contentShareDidStart(): void;
    contentShareDidStop(): void;
    contentShareDidPause(): void;
    contentShareDidUnpause(): void;
    encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void;
    remoteVideoSourcesDidChange(videoSources: VideoSource[]): void;
}
export {};
