import { noEmptyCatchRule } from './rules/no_empty_catch.js';
import { amplifyErrorNameRule } from './rules/amplify_error_name.js';
import { preferAmplifyErrorsRule } from './rules/prefer_amplify_errors.js';
import { noAmplifyErrors } from './rules/no_amplify_errors.js';
import { amplifyErrorNoInstanceOf } from './rules/amplify_error_no_instance_of';
import { backendOutputClientErrorNoInstanceOf } from './rules/backent_output_client_error_no_instance_of.js';
import { propagateErrorCause } from './rules/propagate_error_cause.js';

export const rules: Record<string, unknown> = {
  'amplify-error-name': amplifyErrorNameRule,
  'amplify-error-no-instanceof': amplifyErrorNoInstanceOf,
  'backend-output-client-error-no-instanceof':
    backendOutputClientErrorNoInstanceOf,
  'no-empty-catch': noEmptyCatchRule,
  'prefer-amplify-errors': preferAmplifyErrorsRule,
  'no-amplify-errors': noAmplifyErrors,
  'propagate-error-cause': propagateErrorCause,
};

export const configs = {
  recommended: {
    plugins: ['@aws-amplify/amplify-backend-rules'],
    rules: {
      '@aws-amplify/amplify-backend-rules/amplify-error-name': 'error',
      '@aws-amplify/amplify-backend-rules/amplify-error-no-instanceof': 'error',
      '@aws-amplify/amplify-backend-rules/backend-output-client-error-no-instanceof':
        'error',
      '@aws-amplify/amplify-backend-rules/no-empty-catch': 'error',
      '@aws-amplify/amplify-backend-rules/prefer-amplify-errors': 'off',
      '@aws-amplify/amplify-backend-rules/no-amplify-errors': 'off',
      '@aws-amplify/amplify-backend-rules/propagate-error-cause': 'error',
    },
    overrides: [
      {
        files: [
          'packages/sandbox/src/**',
          'packages/backend-ai/src/**',
          'packages/backend-auth/src/**',
          'packages/backend-deployer/src/**',
          'packages/create-amplify/src/**',
          'packages/form-generator/src/**',
          'packages/model-generator/src/**',
          'packages/schema-generator/src/**',
        ],
        excludedFiles: ['**/*.test.ts'],
        rules: {
          '@aws-amplify/amplify-backend-rules/prefer-amplify-errors': 'error',
        },
      },
      {
        files: [
          'packages/auth-construct/src/**',
          'packages/ai-constructs/src/**',
          'packages/backend-output-storage/src/**',
          'packages/deployed-backend-client/src/**',
        ],
        rules: {
          '@aws-amplify/amplify-backend-rules/no-amplify-errors': 'error',
        },
      },
    ],
  },
};
