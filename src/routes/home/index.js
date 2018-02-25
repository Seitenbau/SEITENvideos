import { h, Component } from 'preact';
import style from './style.scss';
import Folder from '../../components/folder';
import VideoContainer from '../../components/videoContainer';
import Search from '../../components/search';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { retrieveData, setActiveVideo, announceEditMode } from './actions';
import crawl from 'tree-crawl';

export class Home extends Component {
  propTypes = {
    id: PropTypes.number,
    term: PropTypes.string,
    mode: PropTypes.bool,
    retrieveData: PropTypes.func,
    setActiveVideo: PropTypes.func,
    announceEditMode: PropTypes.func,
    data: PropTypes.object
  };

  componentDidMount() {
    this.props.retrieveData();
  }

  getVideoById(tree, videoId) {
    let result;
    crawl(
      tree,
      (node, context) => {
        if (node.type === 'video' && node.meta && node.meta.id === videoId) {
          result = node;
          context.break();
        }
      },
      { getChildren: node => node.items }
    );
    return result;
  }

  componentWillReceiveProps(nextProps) {
    const { id, data } = nextProps;

    const video = id && id.length > 0 ? this.getVideoById(data, id) : null;

    if (video) {
      nextProps.setActiveVideo(video);
    }

    nextProps.announceEditMode(nextProps.mode === 'edit');
  }

  render(props) {
    return (
      <div className={style.home}>
        <VideoContainer className={style.layoutElement} />
        <Search
          className={style.layoutElement}
          isActive={this.props.id === 'search'}
          term={this.props.id === 'search' ? this.props.term : ''}
        />
        <Folder
          data={
            props.searchResults != null ? props.searchResults : props.data.items
          }
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    data: state.home.data,
    searchResults: state.home.searchResults
  };
};

const mapDispatchToProps = dispatch => {
  return {
    retrieveData: () => dispatch(retrieveData()),
    setActiveVideo: video => dispatch(setActiveVideo(video)),
    announceEditMode: editing => dispatch(announceEditMode(editing))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
