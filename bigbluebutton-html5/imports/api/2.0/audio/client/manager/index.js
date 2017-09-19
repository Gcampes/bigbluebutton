import Auth from '/imports/ui/services/auth';
import BaseAudioBridge from '../bridge/base';
import VertoBridge from '../bridge/verto';
import SIPBridge from '../bridge/sip';

class CallStates {
  static get init() {
    return 'initialized state';
  }
  static get echo() {
    return 'do echo test state';
  }
  static get callIntoEcho() {
    return 'calling into echo test state';
  }
  static get inEchoTest() {
    return 'in echo test state';
  }
  static get joinVoiceConference() {
    return 'join voice conference state';
  }
  static get callIntoConference() {
    return 'calling into conference state';
  }
  static get inConference() {
    return 'in conference state';
  }
  static get transferToConference() {
    return 'joining from echo into conference state';
  }
  static get echoTestFailed() {
    return 'echo test failed state';
  }
  static get callToListenOnly() {
    return 'call to listen only state';
  }
  static get connectToListenOnly() {
    return 'connecting to listen only state';
  }
  static get inListenOnly() {
    return 'in listen only state';
  }
  static get reconnecting() {
    return 'reconecting';
  }
}

const ErrorCodes = {
  CODE_1001: '1001',
  CODE_1002: '1002',
  CODE_1003: '1003',
  CODE_1004: '1004',
  CODE_1005: '1005',
  CODE_1006: '1006',
  CODE_1007: '1007',
  CODE_1008: '1008',
  CODE_1009: '1009',
  CODE_1010: '1010',
  CODE_1011: '1011',
};

const AudioErrorCodes = Object.freeze(ErrorCodes);

// manages audio calls and audio bridges
class AudioManager {
  init(userData) {
    // this check ensures changing locales will not rerun init
    if (this.currentState !== undefined) {
      return;
    }
    const MEDIA_CONFIG = Meteor.settings.public.media;
    const audioBridge = MEDIA_CONFIG.useSIPAudio
      ? new SIPBridge(userData)
      : new VertoBridge(userData);

    if (!(audioBridge instanceof BaseAudioBridge)) {
      throw 'Audio Bridge not compatible';
    }

    console.log('INIT AUDIO MANAGER', audioBridge);

    this.bridge = audioBridge;
    this.isListenOnly = false;
    this.microphoneLockEnforced = userData.microphoneLockEnforced;
    this.callStates = CallStates;
    this.currentState = this.callStates.init;

    callbackToAudioBridge = (message) => {
      return new Promise((resolve, reject) => {
        console.log('MESSAGE', message);
        if(message.status === 'failed' || message.status === 'mediafail') {
          console.log('REJECT FROM MANAGER CALLBACK');
          reject(message.status);
        } else if (message.status === 'started'){
          console.log('RESOLVE FROM MANAGER CALLBACK');
          resolve(message.status)
        }
      })

      // switch (message.status) {
      //   case 'failed': {
      //     this.currentState = this.callStates.init;
      //     const audioFailed = new CustomEvent('bbb.webrtc.failed', {
      //       detail: {
      //         status: 'Failed',
      //         errorCode: message.errorcode,
      //       },
      //     });
      //     window.dispatchEvent(audioFailed);
      //     break;
      //   }
      //   case 'mediafail': {
      //     const mediaFailed = new CustomEvent('bbb.webrtc.mediaFailed', {
      //       detail: {
      //         status: 'MediaFailed',
      //       },
      //     });
      //     window.dispatchEvent(mediaFailed);
      //     break;
      //   }
      //   case 'mediasuccess':
      //   case 'started': {
      //     const connected = new CustomEvent('bbb.webrtc.connected', {
      //       detail: {
      //         status: 'started',
      //       },
      //     });
      //     window.dispatchEvent(connected);
      //
      //     break;
      //   }
      // }
    };
  }

  getCurrentState() {
    return this.currentState;
  }

  exitAudio() {
    this.bridge.exitAudio(this.isListenOnly);
    this.currentState = this.callStates.init;
  }

  joinAudio(listenOnly) {
    return new Promise((resolve, reject) => {
      AudioManager.fetchServers().then(({ stunServers, turnServers }) => {
        const shouldJoinListenOnly = listenOnly || this.microphoneLockEnforced;

        if (shouldJoinListenOnly) {
          this.bridge.joinListenOnly(stunServers, turnServers, callbackToAudioBridge.bind(this)).then((response) => {
            this.isListenOnly = true;
            this.currentState = this.callStates.inListenOnly;
            resolve(response);
          }).catch(reason => reject(reason));
        } else {
          this.bridge.joinMicrophone(stunServers, turnServers, callbackToAudioBridge.bind(this)).then((response) => {
            this.currentState = this.callStates.inConference;
            resolve(response);
          }).catch(reason => reject(reason));
        }
      }).catch(error => {
        AudioManager.stunTurnServerFail();
        console.error(error);
        reject(error);
      });
    })
  }

  transferToConference() {
    // TODO: transfer from initialized state
    // TODO: transfer from echo test to conference
    // this.bridge.transferToConference();
  }

  webRTCCallStarted(inEchoTest) {
    if (this.isListenOnly) {
      this.currentState = this.callStates.inListenOnly;
    }
    this.currentState = this.callStates.inConference;
  }

  webRTCCallFailed(inEchoTest, errorcode, cause) {
    if (this.currentState !== this.CallStates.reconecting) {
      this.currentState = this.CallStates.reconecting;
    }
  }

  getMicId() {
    // Placeholder, will get the microphone ID for switching input device
    // this.bridge.getMicId();
  }

  setMicId() {
    // Placeholder, will set the microphone ID for switching input device
    // this.bridge.setMicId();
  }

  getSpeakerId() {
    // Placeholder, will get the speaker ID for switching output device
    // this.bridge.getSpeakerId();
  }

  setSpeakerId() {
    // Placeholder, will set the speaker ID for switching output device
    // this.bridge.setSpeakerId();
  }

  getActiveMic() {
    // Placeholder, will detect active input hardware
    // this.bridge.getActiveMic();
  }

  stunTurnServerFail() {
    const audioFailed = new CustomEvent('bbb.webrtc.failed', {
      detail: {
        status: 'Failed',
        errorCode: AudioErrorCodes.CODE_1009,
      },
    });
    window.dispatchEvent(audioFailed);
  }

  // We use on the SIP an String Array, while in the server, it comes as
  // an Array of objects, we need to map from Array<Object> to Array<String>
  static mapToArray({ response, stunServers, turnServers }) {
    return new Promise((resolve) => {
      if (response) {
        resolve({ error: 404, stunServers: [], turnServers: [] });
      }
      resolve({
        stunServers: stunServers.map(server => server.url),
        turnServers: turnServers.map(server => server.url),
      });
    });
  }

  static fetchServers() {
    return new Promise(async (resolve, reject) => {
      const url = `/bigbluebutton/api/stuns?sessionToken=${Auth.sessionToken}`;

      let response = await fetch(url)
        .then(response => response.json())
        .then(json => AudioManager.mapToArray(json));

      if(response.error) return reject(`Could not fetch the stuns/turns servers!`);
      resolve(response);
    })
  }
}

const AudioManagerSingleton = new AudioManager();
export default AudioManagerSingleton;
export { AudioErrorCodes };
