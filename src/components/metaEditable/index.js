import { h, Component } from 'preact';
import style from './style.scss';
import metaStyle from '../meta/style.scss'; // TODO is this good or is there any other solution?
import PropTypes from 'prop-types';
import Octicon from '../../components/octicon';
import { route } from 'preact-router';
import TagsEditable from '../tagsEditable';
import InlineEditor from '../inlineEditor';
import { connect } from 'react-redux';
import { saveData } from './actions';
import crawl from 'tree-crawl';

export class MetaEditable extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      peopleSuggestions: [],
      tagsSuggestions: [],
      meta: { ...props.meta }
    };
  }

  propTypes = {
    meta: PropTypes.object,
    data: PropTypes.object,
    src: PropTypes.string,
    onSave: PropTypes.func,
    handleSave: PropTypes.func
  };

  getListOfArrayKey(tree, key) {
    let result = [];

    crawl(
      tree,
      node => {
        if (node.meta && node.meta[key]) {
          // check if it's a comma separated string instead of an array, and split it up
          const arr =
            node.meta[key][0] && node.meta[key][0].indexOf(',') > -1
              ? node.meta[key][0].split(',')
              : node.meta[key];

          result = this.mergeArray([result, arr]);
        }
      },
      { getChildren: node => node.items }
    );

    return this.uniqueArray(result);
  }

  mergeArray(arr) {
    return [].concat(...arr);
    //return Array.from(new Set([].concat(...arr))); // merge & unique
  }

  uniqueArray(a) {
    return Array.from(new Set(a));
  }

  componentWillMount() {
    // TODO call this on componentWillReceiveProps?
    // TODO combine these two iterations, so both keys will be returned without iterating twice
    const peopleSuggestions = this.getListOfArrayKey(this.props.data, 'people');
    const tagsSuggestions = this.getListOfArrayKey(this.props.data, 'tags');
    this.setState({ peopleSuggestions, tagsSuggestions });
  }

  handleTitleChange = title => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.title = title;
      return { meta };
    });
  };

  handlePeopleChange = people => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.people = people;
      return { meta };
    });
  };

  handleTagsChange = tags => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.tags = tags;
      return { meta };
    });
  };

  handleDescriptionChange = description => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.description = description;
      return { meta };
    });
  };

  handleSubmit = event => {
    if (event) {
      event.preventDefault();
    }

    this.props.handleSave(this.state.meta, this.props.src);

    // end edit mode
    route(`/${this.props.meta.id}/${this.props.meta.slug}`);
  };

  handleCancel = event => {
    if (event) {
      event.preventDefault();
    }
    route('.');
  };

  handleKeyDown = event => {
    // ctrl-enter or cmd-enter (MacOS) submit
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.keyCode === 13 || event.keyCode === 10)
    ) {
      this.handleSubmit();
    }

    // cancel on escape
    if (event.keyCode === 27) {
      this.handleCancel();
    }
  };

  render(props, state) {
    return (
      <div className={metaStyle.meta}>
        <form
          onSubmit={this.handleSubmit}
          className={style.form}
          onKeyDown={this.handleKeyDown}
        >
          <h1>
            <InlineEditor
              value={state.meta.title}
              placeholder="Enter title..."
              onChange={this.handleTitleChange}
              minlength="3"
              maxlength="150"
              required
            />
          </h1>
          <div className={metaStyle.people}>
            <Octicon name="person" className={metaStyle.icon} />
            <TagsEditable
              tags={state.meta.people}
              suggestions={state.peopleSuggestions}
              placeholder="Add person"
              onChange={this.handlePeopleChange}
            />
          </div>
          <div className={metaStyle.tags}>
            <TagsEditable
              tags={state.meta.tags}
              suggestions={state.tagsSuggestions}
              placeholder="Add tag"
              onChange={this.handleTagsChange}
            />
          </div>
          <div className={metaStyle.description}>
            <InlineEditor
              value={state.meta.description}
              placeholder="Enter description..."
              onChange={this.handleDescriptionChange}
              maxlength="1500"
            />
          </div>
          <div className={style.buttonContainer}>
            <button onClick={this.handleCancel}>Cancel</button>
            <button type="submit" className={style.saveButton + ' primary'}>
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    data: state.home.data
  };
};

const mapDispatchToProps = dispatch => {
  return {
    handleSave: (data, src) => dispatch(saveData(data, src))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MetaEditable);
