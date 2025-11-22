// Storage keys for plugin data
export const STORAGE_KEYS = {
  // Node-level data
  ALT_TEXT: 'a11y-genie:alt-text',
  HEADING: 'a11y-genie:heading',
  LANDMARK: 'a11y-genie:landmark',
  FOCUS_ORDER: 'a11y-genie:focus-order',
  NOTES: 'a11y-genie:notes',

  // Plugin-level data
  SETTINGS: 'a11y-genie:settings',
  MONITORING_RESULTS: 'a11y-genie:monitoring-results',

  // Annotation metadata
  ANNOTATION_VISIBILITY: 'a11y-genie:annotation-visibility',
  ANNOTATION_GROUPS: 'a11y-genie:annotation-groups',

  // Cache
  CACHE_SCAN_RESULTS: 'a11y-genie:cache:scan-results',
  CACHE_NODE_LOOKUP: 'a11y-genie:cache:node-lookup',
} as const;
