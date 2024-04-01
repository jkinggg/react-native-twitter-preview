import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { handleUrlPress } from './Tools';
import { Linking } from 'react-native';

interface TwitterTweetProps {
  url: string;
  style?: object;
  backgroundColor?: string;
  onPressTweet?: () => {};
}

const TWITTER_BASE_EMBED_URL = 'https://publish.twitter.com/oembed?url=';

const TwitterTweet = (props: TwitterTweetProps) => {
  const [loading, setLoading] = React.useState(true);
  const [embedHtml, setEmbedHtml] = React.useState(null);
  const [webviewHeight, setWebviewHeight] = React.useState(250);

  React.useEffect(() => {
    setupEmbed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupEmbed = () => {
    let tweetUrl = TWITTER_BASE_EMBED_URL + encodeURIComponent(props.url || '');
    fetch(tweetUrl, {
      method: 'GET',
      headers: { Accepts: 'application/json' },
    }).then((resp) => {
      resp.json().then((json) => {
        let html = json.html;
        setLoading(false);
        setEmbedHtml(html);
      });
    });
  };

  const renderLoading = () => {
    if (loading) {
      return (
        <View
          style={[
            styles.loadingWrap,
            { backgroundColor: props.backgroundColor || '#fff' },
          ]}
        >
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      );
    } else {
      return <React.Fragment />;
    }
  };

  const onWebViewMessage = (event: WebViewMessageEvent) => {
    setWebviewHeight(Number(event.nativeEvent.data));
    // console.log("webviewHeight:", event.nativeEvent.data)
  };

  const onNavigationStateChange = (navState) => {
    const { url } = navState;
    if (!url.includes('about:blank')) { // Check if the URL is not about:blank or any other URL you want to allow in WebView
      Linking.openURL(url).catch(err => console.error('An error occurred', err)); // Open in the device's default browser
      return false; // Prevent WebView from navigating to the new URL
    }
  };

  const injectedJavaScript = `
    setTimeout(() => {
      window.ReactNativeWebView.postMessage(
        Math.min(document.body.offsetHeight, document.body.scrollHeight)
    );}, 1800)
  `;

  const renderEmbed = () => {
    if (embedHtml) {
      let html = `<!DOCTYPE html>\
            <html>\
              <head>\
                <meta charset="utf-8">\
                <meta name="viewport" content="width=device-width, initial-scale=1.0">\
                </head>\
                <body style="background-color: ${
                  props.backgroundColor || 'white'
                }">\
                    <div>\
                    ${embedHtml}\
                    </div>\
                </body>\
            </html>`;
      return (
        <TouchableOpacity
          style={styles.webviewWrap}
          onPress={
            props.onPressTweet
              ? props.onPressTweet
              : () => handleUrlPress(props.url || '')
          }
          activeOpacity={0.95}
        >
          <View style={styles.webview} pointerEvents="auto">
            <WebView
              source={{ html: html }}
              onMessage={onWebViewMessage}
              injectedJavaScript={injectedJavaScript}
              scrollEnabled={true}
              pointerEvents='auto'
              onNavigationStateChange={onNavigationStateChange}
            />
          </View>
        </TouchableOpacity>
      );
    } else {
      return <React.Fragment />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { height: !loading ? webviewHeight + 20 : 250 },
        props.style,
      ]}
    >
      {renderLoading()}
      {renderEmbed()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flexGrow: 1,
    width: '100%',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewWrap: {
    flex: 1,
    borderRadius: 4,
    borderColor: '#999',
  },
  webview: {
    flex: 1,
  },
});

export default TwitterTweet;
