import { BackendOutputEntry } from './backend_output.js';
import { DeepPartial } from './deep_partial.js';

/**
 * Type for an object that collects output data from constructs
 */
export type BackendOutputStorageStrategy<T extends BackendOutputEntry> = {
  addBackendOutputEntry: (keyName: string, backendOutputEntry: T) => void;
  appendToBackendOutputList: (
    keyName: string,
    backendOutputEntry: DeepPartial<T>,
  ) => void;
};
