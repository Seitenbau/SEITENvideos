import { combineReducers } from 'redux';
import homeReducer from './routes/home/reducer';

const reducers = combineReducers({
  home: homeReducer
  // add more reducers here
});

export default reducers;
