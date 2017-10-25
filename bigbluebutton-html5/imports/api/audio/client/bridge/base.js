const MEDIA = Meteor.settings.public.media;
const STUN_TURN_FETCH_URL = MEDIA.stunTurnServersFetchAddress;
const MEDIA_TAG = MEDIA.mediaTag;

const fetchStunTurnServers = sessionToken =>
  new Promise(async (resolve, reject) => {
    const handleStunTurnResponse = ({ stunServers, turnServers }) => {
      if (!stunServers && !turnServers) {
        return { error: 404, stun: [], turn: [] };
      }
      return {
        stun: stunServers.map(server => server.url),
        turn: turnServers.map(server => server.url),
      };
    };

    const url = `${STUN_TURN_FETCH_URL}?sessionToken=${sessionToken}`;
    const response = await fetch(url)
      .then(res => res.json())
      .then(handleStunTurnResponse);

    if (response.error) return reject('Could not fetch the stuns/turns servers!');
    return resolve(response);
  });

export default class BaseAudioBridge {
  constructor(userData) {
    this.userData = userData;

    const {
      userId,
      username,
      sessionToken,
    } = userData;

    this.user = {
      userId,
      sessionToken,
      name: username,
    };

    this.media = {
      inputDevice: {},
    };

    this.protocol = window.document.location.protocol;
    this.hostname = window.document.location.hostname;
    this.fetchStunTurnServers = fetchStunTurnServers;
    this.mediaTag = MEDIA_TAG;

    this.baseErrorCodes = {
      INVALID_TARGET: 'INVALID_TARGET',
      CONNECTION_ERROR: 'CONNECTION_ERROR',
      REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
      GENERIC_ERROR: 'GENERIC_ERROR',
    };

    this.baseCallStates = {
      started: 'started',
      ended: 'ended',
      failed: 'failed',
    };
  }

  exitAudio() {
    console.error('The Bridge must implement exitAudio');
  }

  joinAudio() {
    console.error('The Bridge must implement joinAudio');
  }

  changeInputDevice() {
    console.error('The Bridge must implement changeInputDevice');
  }

  changeOutputDevice() {
    console.error('The Bridge must implement changeOutputDevice');
  }
}
