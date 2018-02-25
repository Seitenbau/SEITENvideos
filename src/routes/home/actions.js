export function retrieveDataSuccess(newData) {
  return {
    type: 'RETRIEVE_DATA_SUCCESS',
    data: newData
  };
}

export function retrieveDataFailure(error) {
  return {
    type: 'RETRIEVE_DATA_ERROR',
    data: error
  };
}

export function retrieveData() {
  return dispatch => {
    fetch(process.env.API_URL)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(json => {
        dispatch(retrieveDataSuccess(json));
      })
      .catch(error => dispatch(retrieveDataFailure(error)));
  };
}

export function setActiveVideo(video) {
  return {
    type: 'SET_ACTIVE_VIDEO',
    video: video
  };
}

export function announceEditMode(editing) {
  return {
    type: 'SET_EDIT_MODE',
    editing: editing
  };
}
