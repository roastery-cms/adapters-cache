import { CacheUnavailableException } from "@caffeine/errors/infra";

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
                    throw new CacheUnavailableException(
                        contextName,
                        error.code,
                    );

                throw new CacheUnavailableException(
                    contextName,
                    error.message,
                );
            }
        };

        return descriptor;
    };
}
