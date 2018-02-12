import { h, Component } from 'preact';
import Meta from '../../components/meta';
import MetaEditable from 'async!../../components/metaEditable';
import PropTypes from 'prop-types';

export default class ActiveMetaContainer extends Component {
  constructor(props, context) {
    super(props, context);

    this.onSave = this.onSave.bind(this);
    this.getCurrentMeta = this.getCurrentMeta.bind(this);
  }

  state = {
    savedMeta: {}
  };

  onSave(metaData) {
    this.setState({ savedMeta: metaData });
  }

  static propTypes = {
    meta: PropTypes.object
  };

  getCurrentMeta() {
    return Object.keys(this.state.savedMeta).length > 0
      ? this.state.savedMeta
      : this.props.meta;
  }

  render(props) {
    if (Object.keys(props.meta).length > 0) {
      return (
        <div className={props.className}>
          {props.editMode ? (
            <MetaEditable
              meta={this.getCurrentMeta()}
              peopleSuggestions={props.peopleList}
              tagSuggestions={props.tagsList}
              showTitle="true"
              onSave={this.onSave}
            />
          ) : (
            <Meta meta={this.getCurrentMeta()} showTitle="true" />
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
