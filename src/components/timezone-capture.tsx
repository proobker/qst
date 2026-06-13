"use client";

import { useEffect } from "react";
import { updateTimezoneAction } from "@/app/actions/preferences";

type TimezoneCaptureProps = {
  currentTimezone: string;
};

export function TimezoneCapture({ currentTimezone }: TimezoneCaptureProps) {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone || timezone === currentTimezone) {
      return;
    }

    void updateTimezoneAction(timezone);
  }, [currentTimezone]);

  return null;
}
