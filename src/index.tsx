import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import { Global } from '@emotion/core';
import { cssReset } from './cssReset';
import { App } from './App';
import { globalStyles } from './globalStyles';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';

const client = new ApolloClient({
  uri: 'https://api-us-west-2.graphcms.com/v2/ck8dv9ldy0m7o01xkgoo756im/master',
});

const WrappedApp = () => (
  <>
    <ApolloProvider client={client}>
      <Global styles={cssReset} />
      <Global styles={globalStyles} />
      <App />
    </ApolloProvider>
  </>
);

ReactDOM.render(<WrappedApp />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
