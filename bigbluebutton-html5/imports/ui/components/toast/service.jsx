import React from 'react';
import _ from 'lodash';
import { toast } from 'react-toastify';

import Toast from './component';

let lastToast = {
  id: null,
  message: null,
  type: null,
  icon: null,
};

const notify = (message, type = 'default', icon, options) => {
  const settings = {
    type,
    ...options,
  };

  const { id: lastToastId, ...lastToastProps } = lastToast;
  const toastProps = { message, type, icon };

  if (!toast.isActive(lastToast.id) || !_.isEqual(lastToastProps, toastProps)) {
    const id = toast(<Toast {...toastProps} />, settings);

    lastToast = { id, ...toastProps };
  }
};

export default notify;

export const withToast = ComponentToWrap =>
  props => (<ComponentToWrap {...props} toastNotify={notify} />);