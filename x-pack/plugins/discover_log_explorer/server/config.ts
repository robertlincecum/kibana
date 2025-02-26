/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema, offeringBasedSchema } from '@kbn/config-schema';
import { PluginConfigDescriptor } from '@kbn/core/server';

import { DiscoverLogExplorerConfig } from '../common/plugin_config';

export const configSchema = schema.object({
  featureFlags: schema.object({
    deepLinkVisible: offeringBasedSchema({
      serverless: schema.boolean(),
      options: {
        defaultValue: false,
      },
    }),
  }),
});

export const config: PluginConfigDescriptor<DiscoverLogExplorerConfig> = {
  schema: configSchema,
  exposeToBrowser: {
    featureFlags: {
      deepLinkVisible: true,
    },
  },
};
