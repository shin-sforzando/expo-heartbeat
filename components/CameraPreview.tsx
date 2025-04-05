/**
 * CameraPreview component
 * This is a wrapper around HeartbeatMonitor for backward compatibility
 */

import React, { type ReactElement } from "react";
import HeartbeatMonitor from "./HeartbeatMonitor";

/**
 * CameraPreview component
 * @returns HeartbeatMonitor component
 */
export default function CameraPreview(): ReactElement {
    return <HeartbeatMonitor />;
}
