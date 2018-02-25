export function saveDataSuccess(data) {
  return {
    type: 'SAVE_META_SUCCESS',
    data: data
  };
}

export function saveDataFailure(error) {
  return {
    type: 'SAVE_META_ERROR',
    error: error
  };
}

export function saveData(newMeta, src) {
  return dispatch => {
    dispatch({
      type: 'SAVING_META',
      newMeta
    });

    return fetch(src.replace('video.mp4', 'meta.json'), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(newMeta)
    })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(json => {
        console.log('meta saved, received new data', json);
        setTimeout(() => {
          dispatch(saveDataSuccess(json));
        }, 3000);
      })
      .catch(error => dispatch(saveDataFailure(error)));
  };
}
