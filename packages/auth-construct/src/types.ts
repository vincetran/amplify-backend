import { SecretValue, aws_cognito as cognito } from 'aws-cdk-lib';
import { triggerEvents } from './trigger_events.js';
import { BackendOutputStorageStrategy } from '@aws-amplify/plugin-types';
import { AuthOutput } from '@aws-amplify/backend-output-schemas';
import {
  NumberAttributeConstraints,
  StandardAttributes,
  StringAttributeConstraints,
  UserPoolIdentityProviderSamlMetadata,
  UserPoolSESOptions,
} from 'aws-cdk-lib/aws-cognito';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
export type VerificationEmailWithLink = {
  /**
   * The type of verification. Must be one of "CODE" or "LINK".
   */
  verificationEmailStyle?: 'LINK';
  /**
   * Customize your verification emails.
   * Use the link parameter to inject verification links into the user verification email.
   * You can customize the link text by providing a string, as shown in the example below.
   * @example
   * verificationEmailStyle: "LINK",
   * verificationEmailBody: (createLink) => `Your verification link is ${createLink()}.`
   * @example
   * To customize the link text, you can provide custom link text to the .
   * verificationEmailBody: (createLink) => `Your custom verification link is ${createLink('custom link text')}.`
   */
  verificationEmailBody?: (createLink: (text?: string) => string) => string;
  /**
   * The verification email subject.
   */
  verificationEmailSubject?: string;
};
export type VerificationEmailWithCode = {
  /**
   * The type of verification. Must be one of "CODE" or "LINK".
   */
  verificationEmailStyle?: 'CODE';
  /**
   * Customize your verification emails.
   * Use the code parameter to inject verification codes into the user verification email.
   * @example
   * verificationEmailStyle: "CODE",
   * verificationEmailBody: (createCode) => `Your verification code is ${createCode()}.`
   */
  verificationEmailBody?: (createCode: () => string) => string;
  /**
   * The verification email subject.
   */
  verificationEmailSubject?: string;
};
/**
 * Email login settings object.
 */
export type EmailLoginSettings = (
  | VerificationEmailWithLink
  | VerificationEmailWithCode
) & {
  /**
   * Customize the email invitation sent to users when an administrators signs them up.
   */
  userInvitation?: {
    /**
     * The template to the email subject that is sent to the user when an administrator signs them up to the user pool.
     * @default 'Your temporary password'
     */
    emailSubject?: string;
    /**
     * The template to the email body that is sent to the user when an administrator signs them up to the user pool.
     * @default (username, code) => 'Your username is {username()} and temporary password is {code()}.'
     */
    emailBody?: (username: () => string, code: () => string) => string;
    /**
     * The template to the SMS message that is sent to the user when an administrator signs them up to the user pool.
     * @default (username, code) => 'Your username is {username()} and temporary password is {code()}.'
     */
    smsMessage?: (username: () => string, code: () => string) => string;
  };
};
/**
 * Email login options.
 *
 * If true, email login will be enabled with default settings.
 * If settings are provided, email login will be enabled with the specified settings.
 */
export type EmailLogin = true | EmailLoginSettings;
/**
 * Phone number login options.
 *
 * If true, phone number login will be enabled with default settings.
 * If settings are provided, phone number login will be enabled with the specified settings.
 */
export type PhoneNumberLogin =
  | true
  | {
      /**
       * The message template for the verification SMS sent to the user upon sign up.
       * @default
       * // If VerificationEmailStyle.LINK is chosen, verificationMessage will not be configured by default.
       *
       * // If VerificationEmailStyle.CODE is chosen, the default function will be as follows:
       * (code) => `The verification code to your new account is ${createCode()}`
       */
      verificationMessage?: (createCode: () => string) => string;
    };

/**
 * If true, or if a settings object is provided, the MFA token is sent to the user via SMS to their verified phone numbers.
 * @see - https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa-sms-text-message.html
 */
export type MFASmsSettings =
  | boolean
  | {
      /**
       * The SMS message template sent during MFA verification.
       * Use the code parameter in the template where Cognito should insert the verification code.
       * @default
       * smsMessage: (createCode: string) => `Your authentication code is ${createCode()}.`
       */
      smsMessage: (createCode: () => string) => string;
    };
/**
 * If true, the MFA token is a time-based one time password that is generated by a hardware or software token
 * @see - https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa-totp.html
 */
export type MFATotpSettings = boolean;
/**
 * Configure the MFA types that users can use. At least one of totp or sms is required.
 */
export type MFASettings =
  | {
      totp?: MFATotpSettings;
      sms: MFASmsSettings;
    }
  | { totp: MFATotpSettings; sms?: MFASmsSettings };

/**
 * MFA configuration. MFA settings are required if the mode is either "OPTIONAL" or "REQUIRED"
 */
export type MFA =
  | {
      /**
       * Configure whether users can or are required to use multifactor (MFA) to sign in.
       * @default - 'OFF'
       */
      mode: 'OFF';
    }
  | ({
      mode: 'OPTIONAL' | 'REQUIRED';
    } & MFASettings);
/**
 * Properties which all identity providers have
 */
export type IdentityProviderProps = {
  /**
   * Mapping attributes from the identity provider to standard and custom attributes of the user pool.
   * @default - no attribute mapping
   */
  attributeMapping?: AttributeMapping;
};
/**
 * A wrapper for cognito.AttributeMapping that simplifies the way attribute mappings are declared by
 * using strings for attribute name instead of objects with an attributeName property.
 */
export type AttributeMapping = {
  [K in keyof Omit<cognito.AttributeMapping, 'custom'>]: string;
} & {
  /**
   * Specify custom attribute mapping here and mapping for any standard attributes not supported yet.
   * @default - no custom attribute mapping
   */
  custom?: {
    [key: string]: string;
  };
};
/**
 * Google provider.
 */
export type GoogleProviderProps = Omit<
  cognito.UserPoolIdentityProviderGoogleProps,
  'userPool' | 'clientSecretValue' | 'clientSecret' | 'attributeMapping'
> & {
  /**
   * The client secret to be accompanied with clientId for Google APIs to authenticate the client as SecretValue
   * @see https://developers.google.com/identity/sign-in/web/sign-in
   * @default none
   */
  clientSecret?: SecretValue;
} & IdentityProviderProps;

/**
 * Apple provider.
 */
export type AppleProviderProps = Omit<
  cognito.UserPoolIdentityProviderAppleProps,
  'userPool' | 'attributeMapping'
> &
  IdentityProviderProps;

/**
 * Amazon provider.
 */
export type AmazonProviderProps = Omit<
  cognito.UserPoolIdentityProviderAmazonProps,
  'userPool' | 'attributeMapping'
> &
  IdentityProviderProps;

/**
 * Facebook provider.
 */
export type FacebookProviderProps = Omit<
  cognito.UserPoolIdentityProviderFacebookProps,
  'userPool' | 'attributeMapping'
> &
  IdentityProviderProps;

/**
 * OIDC provider.
 */
export type OidcProviderProps = Omit<
  cognito.UserPoolIdentityProviderOidcProps,
  'userPool' | 'attributeRequestMethod' | 'attributeMapping'
> & {
  /**
   * The method to use to request attributes
   * @default 'GET'
   *
   * For details about each option, see below.
   *
   * 'GET' - use GET
   * 'POST' - use POST
   */
  readonly attributeRequestMethod?: 'GET' | 'POST';
} & IdentityProviderProps;

/**
 * SAML provider.
 */
export type SamlProviderProps = Omit<
  cognito.UserPoolIdentityProviderSamlProps,
  'userPool' | 'metadata' | 'attributeMapping'
> & {
  /**
   * The SAML metadata.
   */
  metadata: Omit<UserPoolIdentityProviderSamlMetadata, 'metadataType'> & {
    /**
     * Metadata types that can be used for a SAML user pool identity provider.
     * @example 'URL'
     *
     * For details about each option, see below.
     *
     * 'URL' - Metadata provided via a URL.
     * 'FILE' - Metadata provided via the contents of a file.
     */
    metadataType: 'URL' | 'FILE';
  };
} & IdentityProviderProps;

/**
 * External provider options.
 */
export type ExternalProviderOptions = {
  /**
   * Google OAuth Settings
   */
  google?: GoogleProviderProps;
  /**
   * Facebook OAuth Settings
   */
  facebook?: FacebookProviderProps;
  /**
   * LoginWithAmazon Settings
   */
  loginWithAmazon?: AmazonProviderProps;
  /**
   * SignInWithApple Settings
   */
  signInWithApple?: AppleProviderProps;
  /**
   * OIDC Settings
   */
  oidc?: OidcProviderProps[];
  /**
   * SAML Settings
   */
  saml?: SamlProviderProps;
  /**
   * OAuth scopes that will be allowed with the app client.
   * @example ['PROFILE']
   *
   * For details about each scope, see below.
   *
   * 'PHONE' - Grants access to the 'phone_number' and 'phone_number_verified' claims.
   * Automatically includes access to `OAuthScope.OPENID`.
   *
   * 'EMAIL' - Grants access to the 'email' and 'email_verified' claims.
   * Automatically includes access to `OAuthScope.OPENID`.
   *
   * 'OPENID' - Returns all user attributes in the ID token that are readable by the client
   *
   * 'PROFILE' - Grants access to all user attributes that are readable by the client
   * Automatically includes access to `OAuthScope.OPENID`.
   *
   * 'COGNITO_ADMIN' - Grants access to Amazon Cognito User Pool API operations that require access tokens,
   * such as UpdateUserAttributes and VerifyUserAttribute.
   */
  scopes?: ('PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'COGNITO_ADMIN')[];
  /**
   * List of allowed redirect URLs for the identity providers.
   */
  callbackUrls: string[];
  /**
   * You must provide a unique domain prefix for the Hosted UI that Cognito will use for external login providers.
   * If you do not provide a domain prefix, it will not be configured, and some external login flows will not work.
   *
   * NOTE: If you need to update this in the future, you must first unset it, then deploy the change to remove the domain
   * from the UserPool. After the domain has been removed, you can then provide a new value, and perform another deployment.
   */
  domainPrefix?: string;
  /**
   * List of allowed logout URLs for the identity providers.
   */
  logoutUrls: string[];
};

/**
 * Union type of all supported auth trigger events
 */
export type TriggerEvent = (typeof triggerEvents)[number];

/**
 * CustomAttributeBase is a type that represents the base properties for a custom attribute
 */
export type CustomAttributeBase = {
  /**
   * @default {true}
   */
  mutable?: boolean;
};
/**
 * CustomAttributeString represents a custom attribute of type string.
 */
export type CustomAttributeString = CustomAttributeBase &
  StringAttributeConstraints & {
    dataType: 'String';
  };
/**
 * CustomAttributeNumber represents a custom attribute of type number.
 */
export type CustomAttributeNumber = CustomAttributeBase &
  NumberAttributeConstraints & {
    dataType: 'Number';
  };
/**
 * CustomAttributeBoolean represents a custom attribute of type boolean.
 */
export type CustomAttributeBoolean = CustomAttributeBase & {
  dataType: 'Boolean';
};
/**
 * CustomAttributeDateTime represents a custom attribute of type dataTime.
 */
export type CustomAttributeDateTime = CustomAttributeBase & {
  dataType: 'DateTime';
};
/**
 * CustomAttributes is a union type that represents all the different types of custom attributes.
 */
export type CustomAttribute =
  | CustomAttributeString
  | CustomAttributeNumber
  | CustomAttributeBoolean
  | CustomAttributeDateTime;
/**
 * UserAttributes represents the combined attributes of a user, including
 * standard attributes and any number of custom attributes defined with a 'custom:' prefix.
 */
export type UserAttributes = StandardAttributes &
  Record<`custom:${string}`, CustomAttribute>;

/**
 * CustomEmailSender type for configuring a custom Lambda function for email sending
 */
export type CustomEmailSender = {
  handler: IFunction;
  kmsKeyArn?: string;
};

/**
 * CustomSmsSender type for configuring a custom Lambda function for sms sending
 */
export type CustomSmsSender = {
  handler: IFunction;
  kmsKeyArn?: string;
};

/**
 * Options to enable and configure an IAM role to be used for calling SNS for sending SMS by cognito
 */
export type UserPoolSnsOptions = {
  /**
   * The external ID provides additional security for your IAM role.
   * You can use an `ExternalId` with the IAM role that you use with Amazon SNS to send SMS messages for your user pool. If you provide an `ExternalId` , your Amazon Cognito user pool includes it in the request to assume your IAM role. You can configure the role trust policy to require that Amazon Cognito, and any principal, provide the `ExternalID` . If you use the Amazon Cognito Management Console to create a role for SMS multi-factor authentication (MFA), Amazon Cognito creates a role with the required permissions and a trust policy that demonstrates use of the `ExternalId` .
   * For more information about the `ExternalId` of a role, see [How to use an external ID when granting access to your AWS resources to a third party](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html) .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-userpool-smsconfiguration.html#cfn-cognito-userpool-smsconfiguration-externalid
   */
  readonly externalId?: string;
  /**
   * The Amazon Resource Name (ARN) of the Amazon SNS caller.
   * This is the ARN of the IAM role in your AWS account that Amazon Cognito will use to send SMS messages. SMS messages are subject to a [spending limit](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-email-phone-verification.html) .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-userpool-smsconfiguration.html#cfn-cognito-userpool-smsconfiguration-snscallerarn
   */
  readonly snsCallerArn?: string;
  /**
   * The AWS Region to use with Amazon SNS integration.
   * You can choose the same Region as your user pool, or a supported *Legacy Amazon SNS alternate Region* .
   * Amazon Cognito resources in the Asia Pacific (Seoul) AWS Region must use your Amazon SNS configuration in the Asia Pacific (Tokyo) Region. For more information, see [SMS message settings for Amazon Cognito user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-sms-settings.html) .
   * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-userpool-smsconfiguration.html#cfn-cognito-userpool-smsconfiguration-snsregion
   */
  readonly snsRegion?: string;
};

/**
 * Input props for the AmplifyAuth construct
 */
export type AuthProps = {
  /**
   * Specify a name which will aid in generating resource names.
   */
  name?: string;
  /**
   * Specify how you would like users to log in. You can choose from email, phone, and even external providers such as LoginWithAmazon.
   */
  loginWith: {
    /**
     * Email login options.
     *
     * If true, email login will be enabled with default settings.
     * If settings are provided, email login will be enabled with the specified settings.
     */
    email?: EmailLogin;
    /**
     * Phone number login options.
     *
     * If true, phone number login will be enabled with default settings.
     * If settings are provided, phone number login will be enabled with the specified settings.
     */
    phone?: PhoneNumberLogin;
    /**
     * Configure OAuth, OIDC, and SAML login providers
     */
    externalProviders?: ExternalProviderOptions;
  };
  /**
   * Configure sending behaviors for Emails or SMS messages sent from your auth resource
   * @see https://docs.amplify.aws/react/build-a-backend/auth/customize-auth-lifecycle/email-customization/#custom-senders
   */
  senders?: {
    /**
     * Configure Cognito to send emails from SES or a custom message trigger
     * SES configurations enable the use of customized email sender addresses and names
     * Custom message triggers enable the use of third-party email providers when sending email notifications to users
     * @see https://docs.amplify.aws/react/build-a-backend/auth/moving-to-production/#email
     * @see https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-email-sender.html
     */
    email?:
      | Pick<UserPoolSESOptions, 'fromEmail' | 'fromName' | 'replyTo'>
      | CustomEmailSender;

    sms?: UserPoolSnsOptions | CustomSmsSender;
  };
  /**
   * The set of attributes that are required for every user in the user pool. Read more on attributes here - https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html
   * @default - email/phone will be added as required user attributes if they are included as login methods
   */
  userAttributes?: UserAttributes;
  /**
   * Configure whether users can or are required to use multifactor (MFA) to sign in.
   */
  multifactor?: MFA;
  /**
   * Determined how a user is able to recover their account by setting the account recovery setting.
   *
   * If no setting is provided, a default will be set based on the enabled login methods.
   * When email and phone login methods are both enabled, email will be the default recovery method.
   * If only email or phone are enabled, they will be the default recovery methods.
   * @example
   * "EMAIL_ONLY"
   *
   * For details about each option, see below.
   *
   * 'EMAIL_AND_PHONE_WITHOUT_MFA' - Email if available, otherwise phone, but does not allow a user to reset their password via phone if they are also using it for MFA
   *
   * 'PHONE_WITHOUT_MFA_AND_EMAIL' - Phone if available, otherwise email, but does not allow a user to reset their password via phone if they are also using it for MFA
   *
   * 'EMAIL_ONLY' - Email only
   *
   * 'PHONE_ONLY_WITHOUT_MFA' - Phone only, but does not allow a user to reset their password via phone if they are also using it for MFA
   *
   * 'PHONE_AND_EMAIL' - (Not Recommended) Phone if available, otherwise email, and do allow a user to reset their password via phone if they are also using it for MFA.
   *
   * 'NONE' - None – users will have to contact an administrator to reset their passwords
   */
  accountRecovery?: keyof typeof cognito.AccountRecovery;
  /**
   * Provide a list of user group names to create UserPoolGroups.
   *
   * Group precedence is determined by the ordering of the groups in the list.
   * @example
   * ['admins']
   *
   * Group roles will be generated without any permissions, but you can configure permissions by accessing the generated roles and attaching policies to them.
   *
   * auth.resources.groups['admins'].role.addToPrincipalPolicy(new PolicyStatement({...}))
   */
  groups?: string[];

  /**
   * @internal
   */
  outputStorageStrategy?: BackendOutputStorageStrategy<AuthOutput>;
};
