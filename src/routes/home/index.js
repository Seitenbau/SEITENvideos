import { h, Component } from 'preact';
import style from './style';
import Folder from '../../components/folder';
import VideoContainer from '../../components/videoContainer';
import MetaContainer from '../../components/metaContainer';
import Search from '../../components/search';

export default class Home extends Component {
  state = {
    data: []
  };

  itemsEndpoint = 'http://localhost:3000/items.json';

  componentDidMount() {
    fetch(this.itemsEndpoint)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then(json => {
        this.setState({ data: json });
      });
  }

  render(props, state) {
    return (
      <div class={style.home}>
        <VideoContainer />
        <MetaContainer />
        <Search data={state.data} />
        <Folder id="itemList" data={state.data} />
      </div>
    );
  }
}