import { h, Component } from 'preact';
import style from './style.scss';
import PropTypes from 'prop-types';
import { Link } from 'preact-router/match';
import Octicon from '../../components/octicon';
import ReactAutolink from 'react-autolink';
import { route } from 'preact-router';
import truncate from 'lodash.truncate';

export default class Meta extends Component {
  constructor(props, context) {
    super(props, context);
    this.handleEditButton = this.handleEditButton.bind(this);
  }

  propTypes = {
    meta: PropTypes.object,
    limitDescription: PropTypes.bool
  };

  handleEditButton(event) {
    event.preventDefault();
    const { meta } = this.props;
    route(`/${meta.id}/${meta.slug}/edit`);
  }

  render(props) {
    const { showTitle, meta } = props;
    return (
      <div className={style.meta}>
        {showTitle && <h1>{meta.title}</h1>}
        <div className={style.people}>
          {meta.people.length > 0 && (
            <Octicon name="person" className={style.icon} />
          )}
          {meta.people.map((person, j) => (
            <span key={`person${j}`}>
              <Link href={`/search/${encodeURIComponent(person)}`}>
                {person}
              </Link>
              {meta.people.length === j + 1 ? '' : ', '}
            </span>
          ))}
        </div>
        <div className={style.tags}>
          {meta.tags.map((tag, i) => (
            <Link
              key={`tag${i}`}
              href={`/search/${encodeURIComponent(tag)}`}
              className={style.tag}
            >
              {tag}
            </Link>
          ))}
        </div>
        <div className={style.description}>
          {ReactAutolink.autolink(
            props.limitDescription
              ? truncate(meta.description, {
                  length: props.limitDescription,
                  separator: ' '
                })
              : meta.description
          )}
        </div>
        {showTitle && (
          <button className={style.editButton} onClick={this.handleEditButton}>
            <Octicon name="pencil" className={style.icon} />
            Edit
          </button>
        )}
      </div>
    );
  }
}
