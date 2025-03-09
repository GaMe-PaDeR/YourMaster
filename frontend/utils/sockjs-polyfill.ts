global.WebSocket = require('react-native-websocket').default;
(global as any).window = (global as any).window || {};
(global as any).window.navigator = {}; 