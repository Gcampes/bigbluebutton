import BaseAudioBridge from './base';

const MEDIA = Meteor.settings.public.media;
const VERTO_PORT = MEDIA.vertoPort;
const FS_USERNAME = MEDIA.fsUsername;
const FS_PASSWORD = MEDIA.fsPassword;

export default class VertoBridge extends BaseAudioBridge {
  constructor(userData) {
    console.log('VERTO BRIDGE LUL');
    super(userData);
    const {
      userId,
      username,
      voiceBridge,
    } = userData;

    this.voiceBridge = voiceBridge;
    this.vertoUsername = `${userId}-bbbID-${username}`;
  }

  exitAudio(listenOnly) {
    window.vertoExitAudio();
  }

  joinAudio({ isListenOnly, extension }, managerCallback) {
    console.log('joinAudio');

    const {
      sessionToken,
    } = this.user;

    const vertoJoin = isListenOnly ? 'vertoJoinListenOnly' : 'vertoJoinMicrophone';

    const handleVertoInit = (status) => {

    }

    return this.fetchStunTurnServers(sessionToken)
                        .then(this.createVertoAgent.bind(this))
                        .then(verto => console.log(verto))



    // window[vertoJoin](
    //   'remote-media',
    //   this.voiceBridge,
    //   this.vertoUsername,
    //   null,
    // );
  }

  createVertoAgent({ stun }) {
    console.log('createVertoAgent');
    const {
      protocol,
      hostname,
    } = this;

    const {
      inputDeviceId,
      outputDeviceId,
    } = this.media;

    Verto.prototype.onWSLogin = function (v, success) {
      console.log('OMG WTF');
    };

    console.log(
      {
        login: FS_USERNAME,
        passwd: FS_PASSWORD,
        socketUrl: `${(protocol === 'https:' ? 'wss://' : 'ws://')}${hostname}/ws:${VERTO_PORT}`,
        iceServers: stun.map(s => ({ url: s })),
        deviceParams: {
          useMic: inputDeviceId,
          useSpeak: outputDeviceId,
        },
        tag: this.mediaTag,
        ringFile: 'sounds/bell_ring2.wav',
        sessid: '12c313x123c212xc2',
        videoParams: {
          minFrameRate: 15,
          vertoBestFrameRate: 30,
        },

        deviceParams: {
          useCamera: false,
          useMic: false,
          useSpeak: 'none',
        },

        audioParams: {
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false,
        },
      }
    );
    return $.verto({
      login: FS_USERNAME,
      passwd: FS_PASSWORD,
      socketUrl: `${(protocol === 'https:' ? 'wss://' : 'ws://')}${hostname}:${VERTO_PORT}`,
      iceServers: stun.map(s => ({ url: s })),
      deviceParams: {
        useMic: inputDeviceId,
        useSpeak: outputDeviceId,
      },
      tag: 'remote-media',
      ringFile: 'sounds/bell_ring2.wav',
      sessid: '12c313x123c212xc2',
      videoParams: {
        minFrameRate: 15,
        vertoBestFrameRate: 30,
      },

      deviceParams: {
        useCamera: false,
        useMic: false,
        useSpeak: 'none',
      },

      audioParams: {
        googAutoGainControl: false,
        googNoiseSuppression: false,
        googHighpassFilter: false,
      },
    }, {
      onWSConnect: o => console.log(o),
      onMessage: function (verto, dialog, msg, data) { console.log('LUL') },
      onWSLogin: function (verto, success) {console.log('login', verto, success)},
      onWSClose: (verto, success) => console.log('close', verto, success),
    });
  }

  changeInputDevice(value) {
    this.media.inputDeviceId = value;
  }

  changeOutputDevice(value) {
    const audioContext = document.querySelector(this.mediaTag);

    if (audioContext.setSinkId) {
      audioContext.setSinkId(value);
      this.media.outputDeviceId = value;
    }

    return value;
  }
}
