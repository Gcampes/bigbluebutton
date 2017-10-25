import { Tracker } from 'meteor/tracker';
import { makeCall } from '/imports/ui/services/api';
import VertoBridge from '/imports/api/audio/client/bridge/verto';
import SIPBridge from '/imports/api/audio/client/bridge/sip';
import { notify } from '/imports/ui/services/notification';

const MEDIA = Meteor.settings.public.media;
const USE_SIP = MEDIA.useSIPAudio;
const ECHO_TEST_NUMBER = MEDIA.echoTestNumber;

const CALL_STATES = {
  STARTED: 'started',
  ENDED: 'ended',
  FAILED: 'failed',
};

class AudioManager {
  constructor() {
    this._inputDevice = {
      tracker: new Tracker.Dependency(),
    };

    this.defineProperties({
      isMuted: false,
      isConnected: false,
      isConnecting: false,
      isListenOnly: false,
      isEchoTest: false,
      error: null,
      outputDeviceId: null,
    });
  }

  init(userData, messages) {
    this.bridge = USE_SIP ? new SIPBridge(userData) : new VertoBridge(userData);
    this.userData = userData;
    this.messages = messages;
    this.changeInputDevice();
  }

  defineProperties(obj) {
    Object.keys(obj).forEach((key) => {
      const privateKey = `_${key}`;
      this[privateKey] = {
        value: obj[key],
        tracker: new Tracker.Dependency(),
      };

      Object.defineProperty(this, key, {
        set: (value) => {
          this[privateKey].value = value;
          this[privateKey].tracker.changed();
        },
        get: () => {
          this[privateKey].tracker.depend();
          return this[privateKey].value;
        },
      });
    });
  }

  joinAudio(options = {}) {
    const {
      isListenOnly,
      isEchoTest,
    } = options;

    this.isConnecting = true;
    this.isMuted = false;
    this.error = null;
    this.isListenOnly = isListenOnly || false;
    this.isEchoTest = isEchoTest || false;

    const callOptions = {
      isListenOnly: this.isListenOnly,
      extension: isEchoTest ? ECHO_TEST_NUMBER : null,
    };

    return this.bridge.joinAudio(callOptions, this.callStateCallback.bind(this));
  }

  exitAudio() {
    return this.bridge.exitAudio();
  }

  transferCall() {
    this.onTransferStart();
    return this.bridge.transferCall(this.onAudioJoin.bind(this));
  }

  toggleMuteMicrophone() {
    makeCall('toggleSelfVoice').then(() => {
      this.onToggleMicrophoneMute();
    });
  }

  onAudioJoin() {
    this.isConnecting = false;
    this.isConnected = true;

    if (!this.isEchoTest) {
      this.notify(this.messages.info.JOINED_AUDIO);
    }
  }

  onTransferStart() {
    this.isEchoTest = false;
    this.isConnecting = true;
  }

  onAudioExit() {
    this.isConnected = false;
    this.isConnecting = false;


    if (!this.error && !this.isEchoTest) {
      this.notify(this.messages.info.LEFT_AUDIO);
    }
    this.isEchoTest = false;
  }

  onToggleMicrophoneMute() {
    this.isMuted = !this.isMuted;
  }

  callStateCallback(response) {
    return new Promise((resolve) => {
      const {
        STARTED,
        ENDED,
        FAILED,
      } = CALL_STATES;

      const {
        status,
        error,
        bridgeError,
      } = response;

      if (status === STARTED) {
        this.onAudioJoin();
        resolve(STARTED);
      } else if (status === ENDED) {
        this.onAudioExit();
      } else if (status === FAILED) {
        this.error = error;
        this.notify(this.messages.error[error]);
        console.error('Audio Error:', error, bridgeError);
        this.onAudioExit();
      }
    });
  }

  async changeInputDevice(deviceId) {
    try {
      this.inputDeviceId = await this.bridge.changeInputDevice(deviceId);
    } catch(err) {
      this.error = err;
      this.notify('There was a problem getting the media devices');
    }
  }

  async changeOutputDevice(deviceId) {
    this.outputDeviceId = await this.bridge.changeOutputDevice(deviceId);
  }

  set inputDeviceId(value) {
    this._inputDevice.id = value;
    this._inputDevice.tracker.changed();
  }

  get inputDeviceId() {
    this._inputDevice.tracker.depend();
    return this._inputDevice.id;
  }

  set userData(value) {
    this._userData = value;
  }

  get userData() {
    return this._userData;
  }

  notify(message) {
    notify(message,
           this.error ? 'error' : 'info',
           this.isListenOnly ? 'audio_on' : 'unmute');
  }
}

const audioManager = new AudioManager();
export default audioManager;
