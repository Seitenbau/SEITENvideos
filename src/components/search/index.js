import { h, Component } from 'preact';
import PropTypes from 'prop-types';
import style from './style.scss';
import Octicon from '../../components/octicon';
import { route } from 'preact-router';
import fuzzysort from 'fuzzysort';
import { setSearchResults } from './actions';
import { connect } from 'react-redux';

export class Search extends Component {
  state = {
    searchTerm: ''
  };

  propTypes = {
    term: PropTypes.string,
    isActive: PropTypes.bool,
    data: PropTypes.object,
    setSearchResults: PropTypes.func
  };

  /**
   * Ref to the input element
   */
  searchInput;

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) {
      this.initFirstSearch(nextProps);
    }
    if (this.props.term !== nextProps.term) {
      this.initFirstSearch(nextProps);
    }
  }

  componentDidMount() {
    this.searchInput.focus();
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.data !== nextProps.data) {
      return true;
    }
    if (this.props.term !== nextProps.term) {
      return true;
    }
  }

  /**
   * First search when route is loaded
   * @param {object} nextProps
   */
  initFirstSearch(nextProps) {
    if (this.searchInput && nextProps.term && nextProps.isActive) {
      this.setState({ searchTerm: nextProps.term }, () =>
        this.searchInput.focus()
      );
      this.triggerInputEvent();
    }
  }

  triggerInputEvent() {
    setTimeout(() => {
      const event = new Event('input');
      this.searchInput.dispatchEvent(event);
    }, 1);
  }

  resetSearch = event => {
    if (event) {
      event.preventDefault();
    }
    this.setState({ searchTerm: '' }, () => {
      this.triggerInputEvent();
      this.searchInput.focus();
      route('/');
    });
  };

  search = event => {
    const term = event.target.value.replace(/\s{2,}/g, ' '); // remove multiple spaces
    this.setState({ searchTerm: term });
    const searchQuery = term.trim();

    let results = null;

    if (searchQuery !== '') {
      const copy = o => ({ ...o });

      const fuzzyOptions = {
        threshold: -200, // ignore matches with a lower score than this
        limit: 1 // we only need to know if there is at least one result
      };
      results = this.props.data.items.map(copy).filter(function f(o) {
        if (o.type == 'video') {
          const searchResults = fuzzysort.go(
            searchQuery,
            [
              o.meta.title,
              o.meta.description,
              o.meta.tags.join(','),
              o.meta.people.join(','),
              o.src
            ],
            fuzzyOptions
          );
          return searchResults.length !== 0;
        }

        if (o.items) {
          return (o.items = o.items.map(copy).filter(f)).length;
        }
      });

      /*
      console.time('searchString');
      const results = this.props.data.map(copy).filter(function f(o) {
        if (o.meta && o.meta.id) {
          const targets = [o.meta.title.toLowerCase(), o.meta.description.toLowerCase(), o.meta.tags.join(',').toLowerCase(), o.meta.people.join(',').toLowerCase(), o.meta.src.toLowerCase()];
          return targets.some(target => target.includes(searchQuery.toLowerCase()));
        }

        if (o.items) {
          return (o.items = o.items.map(copy).filter(f)).length;
        }
      });
      console.timeEnd('searchString');
      */
    }
    this.props.setSearchResults(results);
  };

  handleKeyDown = event => {
    // prevent submit when pressing Enter & route to search URL
    if (event.keyCode === 13) {
      event.preventDefault();
      route(`/search/${encodeURIComponent(event.target.value)}`);
    }

    // reset search when pressing ESC
    if (event.keyCode === 27) {
      this.resetSearch();
    }
  };

  render(props, state) {
    return (
      <form className={style.searchForm} role="search">
        <span>
          <input
            ref={input => (this.searchInput = input)}
            type="text"
            autoComplete="off"
            placeholder="Search"
            onInput={this.search}
            onKeyDown={this.handleKeyDown}
            className={style.searchField}
            value={state.searchTerm}
          />
          {this.state.searchTerm && (
            <button onClick={this.resetSearch} className={style.resetButton}>
              <Octicon name="x" className={style.resetIcon} />
            </button>
          )}
        </span>
      </form>
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
    setSearchResults: data => dispatch(setSearchResults(data))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Search);
