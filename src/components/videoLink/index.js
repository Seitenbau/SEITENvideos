import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

export default class VideoLink extends Component {
  state = {
    indexed: false
  };

  render(props) {
    const { data } = props;

    // data.meta.slug = slugify(data.src);
    if (this.state.indexed === false && props.createSearchIndex) {
      props.createSearchIndex(data.meta);
      this.setState({ indexed: true });
    }

    const rTags = data.meta.tags.map(tag => (
      <a href={encodeURIComponent(tag)} className="tag">
        {tag}
      </a>
    ));

    return (
      <li id={data.meta.slug} className="video">
        <a
          href={encodeURIComponent(data.meta.slug)}
          className="videolink"
          data-video={data.src}
        >
          {data.meta.title}
        </a>
        <div className="meta">
          <div className="people">
            <img
              className="icon"
              src="/octicons/build/svg/person.svg"
              alt="person"
              role="presentation"
            />
            {data.meta.people.join(', ')}
          </div>
          <div className="tags">
            {data.meta.tags.map(tag => (
              <a href={encodeURIComponent(tag)} className="tag">
                {tag}
              </a>
            ))}
          </div>
        </div>
        <div className="description">{data.meta.description}</div>
      </li>
    );
  }
}