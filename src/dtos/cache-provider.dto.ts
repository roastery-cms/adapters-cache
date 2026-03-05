import { t } from "@roastery/terroir";

export const CacheProviderDTO = t.Union([
	t.Literal("REDIS"),
	t.Literal("MEMORY"),
]);

export type CacheProviderDTO = t.Static<typeof CacheProviderDTO>;
