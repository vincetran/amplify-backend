import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { createGraphqlTypesGenerator } from './create_graphql_types_generator.js';
import {
  AWSClientProvider,
  BackendIdentifier,
} from '@aws-amplify/plugin-types';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import {
  BackendOutputClientError,
  BackendOutputClientErrorType,
  BackendOutputClientFactory,
} from '@aws-amplify/deployed-backend-client';
import { AmplifyUserError } from '@aws-amplify/platform-core';

const awsClientProvider = {
  getAmplifyClient: () => new AmplifyClient(),
  getCloudFormationClient: () => new CloudFormationClient(),
};
void describe('types generator factory', () => {
  void it('throws an error if a null backendIdentifier is passed in', async () => {
    assert.throws(() =>
      createGraphqlTypesGenerator({
        backendIdentifier: null as unknown as BackendIdentifier,
        awsClientProvider,
      }),
    );
  });

  void it('throws an error if null awsClientProvider is passed in', async () => {
    assert.throws(() =>
      createGraphqlTypesGenerator({
        backendIdentifier: { stackName: 'foo' },
        awsClientProvider: null as unknown as AWSClientProvider<{
          getAmplifyClient: AmplifyClient;
          getCloudFormationClient: CloudFormationClient;
        }>,
      }),
    );
  });

  void it('throws an AmplifyUserError if stack deployment is in progress', async () => {
    const fakeBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.DEPLOYMENT_IN_PROGRESS,
          'deployment in progress',
        );
      }),
    };
    mock.method(
      BackendOutputClientFactory,
      'getInstance',
      () => fakeBackendOutputClient,
    );
    const generator = createGraphqlTypesGenerator({
      backendIdentifier: { stackName: 'foo' },
      awsClientProvider,
    });
    await assert.rejects(
      () => generator.generateTypes({ target: 'json' }),
      (error: AmplifyUserError) => {
        assert.strictEqual(
          error.message,
          'Deployment is currently in progress.',
        );
        assert.ok(error.resolution);
        return true;
      },
    );
  });

  void it('throws an AmplifyUserError if stack does not exist', async () => {
    const fakeBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.NO_STACK_FOUND,
          'stack does not exist',
        );
      }),
    };
    mock.method(
      BackendOutputClientFactory,
      'getInstance',
      () => fakeBackendOutputClient,
    );
    const generator = createGraphqlTypesGenerator({
      backendIdentifier: { stackName: 'stackThatDoesNotExist' },
      awsClientProvider,
    });
    await assert.rejects(
      () => generator.generateTypes({ target: 'json' }),
      (error: AmplifyUserError) => {
        assert.strictEqual(error.message, 'Stack does not exist.');
        assert.ok(error.resolution);
        return true;
      },
    );
  });

  void it('throws an AmplifyUserError if stack outputs are undefined', async () => {
    const fakeBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.NO_OUTPUTS_FOUND,
          'stack outputs are undefined',
        );
      }),
    };
    mock.method(
      BackendOutputClientFactory,
      'getInstance',
      () => fakeBackendOutputClient,
    );
    const generator = createGraphqlTypesGenerator({
      backendIdentifier: { stackName: 'stackThatDoesNotHaveOutputs' },
      awsClientProvider,
    });
    await assert.rejects(
      () => generator.generateTypes({ target: 'json' }),
      (error: AmplifyUserError) => {
        assert.strictEqual(
          error.message,
          'Amplify outputs not found in stack metadata',
        );
        assert.ok(error.resolution);
        return true;
      },
    );
  });

  void it('throws an AmplifyUserError if credentials are expired when getting backend outputs', async () => {
    const fakeBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.CREDENTIALS_ERROR,
          'token is expired',
        );
      }),
    };
    mock.method(
      BackendOutputClientFactory,
      'getInstance',
      () => fakeBackendOutputClient,
    );
    const generator = createGraphqlTypesGenerator({
      backendIdentifier: { stackName: 'randomStack' },
      awsClientProvider,
    });
    await assert.rejects(
      () => generator.generateTypes({ target: 'json' }),
      (error: AmplifyUserError) => {
        assert.strictEqual(
          error.message,
          'Unable to get backend outputs due to invalid credentials.',
        );
        assert.ok(error.resolution);
        return true;
      },
    );
  });

  void it('throws an AmplifyUserError if access is denied when getting backend outputs', async () => {
    const fakeBackendOutputClient = {
      getOutput: mock.fn(() => {
        throw new BackendOutputClientError(
          BackendOutputClientErrorType.ACCESS_DENIED,
          'access is denied',
        );
      }),
    };
    mock.method(
      BackendOutputClientFactory,
      'getInstance',
      () => fakeBackendOutputClient,
    );
    const generator = createGraphqlTypesGenerator({
      backendIdentifier: { stackName: 'randomStack' },
      awsClientProvider,
    });
    await assert.rejects(
      () => generator.generateTypes({ target: 'json' }),
      (error: AmplifyUserError) => {
        assert.strictEqual(
          error.message,
          'Unable to get backend outputs due to insufficient permissions.',
        );
        assert.ok(error.resolution);
        return true;
      },
    );
  });
});
