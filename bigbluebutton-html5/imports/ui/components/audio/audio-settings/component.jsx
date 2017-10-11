import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import Button from '/imports/ui/components/button/component';
import { withModalMounter } from '/imports/ui/components/modal/service';
import styles from '../audio-modal/styles.scss';

import DeviceSelector from '/imports/ui/components/audio/device-selector/component';
import AudioStreamVolume from '/imports/ui/components/audio/audio-stream-volume/component';
import EnterAudioContainer from '/imports/ui/components/audio/enter-audio/container';
import AudioTestContainer from '/imports/ui/components/audio/audio-test/container';
import cx from 'classnames';

class AudioSettings extends React.Component {
  constructor(props) {
    super(props);

    this.chooseAudio = this.chooseAudio.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleOutputChange = this.handleOutputChange.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      inputDeviceId: undefined,
    };
  }

  chooseAudio() {
    this.props.changeMenu(this.props.JOIN_AUDIO);
  }

  handleInputChange(deviceId) {
    console.log(`INPUT DEVICE CHANGED: ${deviceId}`);
    this.setState({
      inputDeviceId: deviceId,
    });
  }

  handleOutputChange(deviceId) {
    console.log(`OUTPUT DEVICE CHANGED: ${deviceId}`);
  }

  handleClose() {
    this.setState({ isOpen: false });
    this.props.mountModal(null);
  }

  render() {
    const {
      intl,
    } = this.props;

    const isDeviceiOS = window.navigator.userAgent === 'BigBlueButton';

    const titleMessage = isDeviceiOS ? intlMessages.titleLabeliOS : intlMessages.titleLabel;

    return (
      <div>
        <div className={styles.topRow}>
          <Button
            className={styles.backBtn}
            label={intl.formatMessage(intlMessages.backLabel)}
            icon={'left_arrow'}
            size={'md'}
            color={'primary'}
            ghost
            onClick={this.chooseAudio}
          />
          <div className={cx(styles.title, styles.chooseAudio)}>
            {intl.formatMessage(titleMessage)}
          </div>
        </div>
        {isDeviceiOS ? this.renderiOS() : this.renderDefault()}
        <div className={styles.enterAudio}>
          <EnterAudioContainer isFullAudio={true}/>
        </div>
      </div>
    );
  }

  renderDefault() {
    const {
      intl,
    } = this.props;

    return (
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.audioNote}>
            {intl.formatMessage(intlMessages.descriptionLabel)}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <div className={styles.formElement}>
              <label className={cx(styles.label, styles.labelSmall)}>
                {intl.formatMessage(intlMessages.micSourceLabel)}
              </label>
              <DeviceSelector
                value={this.state.inputDeviceId}
                className={styles.select}
                kind="audioinput"
                onChange={this.handleInputChange} />
            </div>
          </div>
          <div className={styles.col}>
            <div className={styles.formElement}>
              <label className={cx(styles.label, styles.labelSmall)}>
                {intl.formatMessage(intlMessages.speakerSourceLabel)}
              </label>
              <DeviceSelector
                  value={this.state.outputDeviceId}
                  className={styles.select}
                  kind="audiooutput"
                  onChange={this.handleOutputChange} />
            </div>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <div className={styles.formElement}>
              <label className={cx(styles.label, styles.labelSmall)}>
                {intl.formatMessage(intlMessages.streamVolumeLabel)}
                <AudioStreamVolume
                  deviceId={this.state.inputDeviceId}
                  className={styles.audioMeter} />
              </label>
            </div>
          </div>
          <div className={styles.col}>
            <label className={styles.label}> </label>
            <AudioTestContainer/>
          </div>
        </div>
      </div>
    )
  }

  renderiOS() {
    const {
      intl,
    } = this.props;

    return (
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.audioNote}>
            {intl.formatMessage(intlMessages.descriptionLabeliOS)}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <div className={styles.formElement}>
              <label className={cx(styles.label, styles.labelSmall)}>
                {intl.formatMessage(intlMessages.streamVolumeLabel)}
              </label>
              <AudioStreamVolume
                deviceId={this.state.inputDeviceId}
                className={styles.audioMeter} />
            </div>
          </div>
          <div className={styles.col}>
            <label className={styles.label}> </label>
            <AudioTestContainer/>
          </div>
        </div>
      </div>
    )
  }
}

const intlMessages = defineMessages({
  backLabel: {
    id: 'app.audio.backLabel',
    description: 'audio settings back button label',
  },
  titleLabel: {
    id: 'app.audio.audioSettings.titleLabel',
    description: 'audio setting title label',
  },
  titleLabeliOS: {
    id: 'app.audio.audioSettings.titleLabel.iOS',
    description: 'audio setting title label for iOS devices',
  },
  descriptionLabel: {
    id: 'app.audio.audioSettings.descriptionLabel',
    description: 'audio settings description label',
  },
  descriptionLabeliOS: {
    id: 'app.audio.audioSettings.descriptionLabel.iOS',
    description: 'audio settings description label for iOS devices',
  },
  micSourceLabel: {
    id: 'app.audio.audioSettings.microphoneSourceLabel',
    description: 'Label for mic source',
  },
  speakerSourceLabel: {
    id: 'app.audio.audioSettings.speakerSourceLabel',
    description: 'Label for speaker source',
  },
  streamVolumeLabel: {
    id: 'app.audio.audioSettings.microphoneStreamLabel',
    description: 'Label for stream volume',
  },
});

export default withModalMounter(injectIntl(AudioSettings));
