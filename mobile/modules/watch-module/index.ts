import { NativeModulesProxy,EventEmitter,EventSubscription } from 'expo-modules-core';

import WatchModule from './src/WatchModule';

import {
  ChangeEventPayload,
  WatchModuleViewProps,
} from './src/WatchModule.types';

export function startListening() {
  WatchModule.startListening();
}

export function disableListening() {
  WatchModule.disableListening();
}

const emitter = new EventEmitter(WatchModule ?? NativeModulesProxy.WatchModule);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): EventSubscription {
  return WatchModule.addListener('onChange', listener);
}

export function removeListener() {
  WatchModule.removeAllListeners('onChange');
}

export { WatchModuleViewProps, ChangeEventPayload };

export function send(message: Record<string, any>) {
    return WatchModule.send(message);
}