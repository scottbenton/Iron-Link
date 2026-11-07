import { useCallback } from "react";

import {
  AnalyticsService,
  LoggerCategory,
  LoggerVerb,
} from "services/analytics.service";

export { LoggerCategory, LoggerVerb };

// Components log analytics events through this hook rather than calling the
// service themselves, as page views do through useSendPageViewEvent.
export function useLogEvent() {
  return useCallback(
    (category: LoggerCategory, object: string, verb: LoggerVerb) => {
      AnalyticsService.logEvent(category, object, verb);
    },
    [],
  );
}
