import { h, Component } from 'preact';
import Meta from '../../components/meta';
import MetaEditable from 'async!../../components/metaEditable';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export class ActiveMetaContainer extends Component {
  static propTypes = {
    activeVideo: PropTypes.object
  };

  render(props) {
    const meta = props.activeVideo.meta;
    if (meta && Object.keys(meta).length > 0) {
      return (
        <div className={props.className}>
          {props.editMode ? (
            <MetaEditable
              meta={meta}
              src={props.activeVideo.src}
              showTitle="true"
              onSave={this.onSave}
            />
          ) : (
            <Meta meta={meta} showTitle="true" />
          )}
        </div>
      );
    } else {
      return (
        <div className={props.className}>
          <h1>Welcome to SBideo!</h1>
          <p>Just search and select a video below.</p>
        </div>
      );
    }
  }
}

const mapStateToProps = state => {
  return {
    activeVideo: state.home.activeVideo,
    editMode: state.home.editMode
  };
};

export default connect(mapStateToProps)(ActiveMetaContainer);
