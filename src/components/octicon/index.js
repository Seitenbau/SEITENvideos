import { h, Component } from 'preact';
import PropTypes from 'prop-types';

export class Octicon extends Component {
  state = {
    icon: {}
  };

  componentDidMount() {
    import(`octicons/build/svg/${this.props.name}.svg`).then(icon => {
      this.setState({
        icon: icon
      });
    });
  }

  render(props, state) {
    // inline svg as react component
    return <state.icon.ReactComponent {...props} />;
  }
}

Octicon.propTypes = {
  name: PropTypes.string
};

export default Octicon;
