import { h, Component } from 'preact';
import style from './style.scss';
import { connect } from 'react-redux';

export class VideoPlayer extends Component {
  render(props) {
    const bgImageStyle = `background-image: url(${
      process.env.ASSET_PATH
    }FuBK_testcard_vectorized.svg)`;
    return (
      <div className={props.className}>
        <div className={style.sizer}>
          {props.activeVideo.src ? (
            <video
              className={style.video}
              controls
              autoPlay
              src={props.activeVideo.src}
              style={bgImageStyle}
            />
          ) : (
            <div className={style.poster} style={bgImageStyle} />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    activeVideo: state.home.activeVideo
  };
};

export default connect(mapStateToProps)(VideoPlayer);
