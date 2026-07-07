import { CacheUnavailableException } from "@roastery/terroir/exceptions/infra";

/**
 * Method decorator that wraps an async method with structured error handling
 * for Redis connection failures, re-throwing them as a typed
 * `CacheUnavailableException` from `@roastery/terroir`.
 *
 * Recognizes three common Redis connection error codes
 * (`ERR_REDIS_CONNECTION_CLOSED`, `ERR_REDIS_AUTHENTICATION_FAILED`,
 * `ERR_REDIS_INVALID_RESPONSE`) and rethrows them with that code as the
 * exception's message. Any other error is rethrown with its own `message`.
 *
 * @param layerName - Context name included in the thrown exception. Defaults
 * to the decorated method's class name (`target.constructor.name`) when
 * omitted.
 * @returns A method decorator that replaces the original method with a
 * version wrapped in a try/catch translating Redis errors.
 * @throws {CacheUnavailableException} Whenever the wrapped method throws —
 * either with a known Redis connection error code, or with the original
 * error's message.
 *
 * @example
 * ```typescript
 * class UserCacheRepository {
 *   @SafeCache("UserCacheRepository")
 *   async get(key: string) {
 *     return this.cache.get(key);
 *   }
 * }
 * ```
 */
export function SafeCache(layerName?: string) {
	return (
		target: object,
		_propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const RedisCommonErrors = [
			"ERR_REDIS_CONNECTION_CLOSED",
			"ERR_REDIS_AUTHENTICATION_FAILED",
			"ERR_REDIS_INVALID_RESPONSE",
		] as const;

		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]) {
			try {
				return await originalMethod.apply(this, args);
			} catch (_error: unknown) {
				const error = _error as {
					code?: (typeof RedisCommonErrors)[number];
					message: string;
				};

				const contextName = layerName || target.constructor.name;

				if (error?.code && RedisCommonErrors.includes(error.code))
					throw new CacheUnavailableException(contextName, error.code);

				throw new CacheUnavailableException(contextName, error.message);
			}
		};

		return descriptor;
	};
}
