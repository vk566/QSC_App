/**
 * @format
 */
// 1. THIS MUST BE THE VERY FIRST LINE
import 'react-native-url-polyfill/auto'; 

import {AppRegistry} from 'react-native';
import App from './App'; // Or './MainApp' if you renamed it
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);