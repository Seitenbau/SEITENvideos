import { h } from 'preact';
import { Home } from '../index.js';
import { shallow } from 'preact-render-spy';
jest.mock('../../../components/activeMetaContainer', () => <div />);

describe('Test of the Homepage', () => {
  test('Homepage renders the 3 main components', () => {
    const context = shallow(
      <Home data={{ items: [] }} retrieveData={() => {}} />
    );
    expect(context.find('Folder').length).toBe(1);
    expect(context.find('Connect').length).toBe(2); // VideoContainer, Search
  });
});
