/**
 * The upstream package currently exports its TypeScript implementation directly
 * and does not ship declaration files. Keep the versioning config type here so
 * our typecheck does not compile the dependency's internal source tree.
 */
import type { StarlightPlugin } from '@astrojs/starlight/types';

export interface StarlightVersionsUserConfig {
  current?: {
    redirect?: 'root' | 'same-page';
    label?: string;
  };
  exclude?: string[];
  versions: Array<{
    redirect?: 'root' | 'same-page';
    label?: string;
    slug: string;
  }>;
}

declare const starlightVersions: (config: StarlightVersionsUserConfig) => StarlightPlugin;

export default starlightVersions;
