import type {
  ExtendedSubscription,
  Subscription,
  SubscriptionExtension,
} from "@/types/xapi-collection";

export const useExtendedSubscription = <
  T extends Subscription<any>,
  X extends SubscriptionExtension<any, any>[],
>(
  subscription: T,
  ...extensions: X
): ExtendedSubscription<T, X> => {
  let extendedSubscription: ExtendedSubscription<T, any> = {
    ...subscription,
  };

  for (const extension of extensions) {
    extendedSubscription = {
      ...extendedSubscription,
      ...extension(subscription),
    };
  }

  return extendedSubscription as ExtendedSubscription<T, X>;
};
