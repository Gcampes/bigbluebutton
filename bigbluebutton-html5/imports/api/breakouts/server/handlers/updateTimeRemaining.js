import Breakouts from '/imports/api/breakouts';
import Logger from '/imports/startup/server/logger';
import { check } from 'meteor/check';

export default function updateTimeRemaining({ payload }) {
  const {
    meetingId,
    timeRemaining,
  } = payload;

  check(meetingId, String);
  check(timeRemaining, Number);

  const selector = {
    parentMeetingId: payload.meetingId,
  };

  const modifier = {
    $set: {
      timeRemaining: payload.timeRemaining,
    },
  };

  const options = {
    multi: true,
  };

  const cb = (err, numChanged) => {
    if (err) {
      return Logger.error(`Updating breakouts: ${err}`);
    }

    if (numChanged) {
      return Logger.info(`Updated breakouts with parentMeetingId=${payload.meetingId}`);
    }
  };

  return Breakouts.update(selector, modifier, options, cb);
}