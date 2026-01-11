/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/examples/01-connect-wallet`; params?: Router.UnknownInputParams; } | { pathname: `/examples/02-gasless-transfer`; params?: Router.UnknownInputParams; } | { pathname: `/examples/03-raydium-swap`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/examples/01-connect-wallet`; params?: Router.UnknownOutputParams; } | { pathname: `/examples/02-gasless-transfer`; params?: Router.UnknownOutputParams; } | { pathname: `/examples/03-raydium-swap`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `/examples/01-connect-wallet${`?${string}` | `#${string}` | ''}` | `/examples/02-gasless-transfer${`?${string}` | `#${string}` | ''}` | `/examples/03-raydium-swap${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/examples/01-connect-wallet`; params?: Router.UnknownInputParams; } | { pathname: `/examples/02-gasless-transfer`; params?: Router.UnknownInputParams; } | { pathname: `/examples/03-raydium-swap`; params?: Router.UnknownInputParams; };
    }
  }
}
