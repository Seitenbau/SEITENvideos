import { h, Component } from 'preact';
import VideoPlayer from '../../components/videoPlayer';
import ActiveMetaContainer from '../../components/activeMetaContainer';
import PropTypes from 'prop-types';
import style from './style.scss';
import { connect } from 'react-redux';

export class VideoContainer extends Component {
  propTypes = {
    activeVideo: PropTypes.object
  };

  componentWillReceiveProps(nextProps) {
    const shouldScroll =
      this.props.activeVideo.meta.id !== nextProps.activeVideo.meta.id;

    if (shouldScroll) {
      window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    }
  }

  render() {
    return (
      <div className={style.wrapper}>
        <VideoPlayer className={style.videoPlayer} />
        <ActiveMetaContainer className={style.activeMetaContainer} />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    activeVideo: state.home.activeVideo
  };
};

export default connect(mapStateToProps)(VideoContainer);
