/**
 * Heartbeat detector module
 * Processes camera frames to detect heartbeats and calculate BPM
 */

import {
    bandpassFilter,
    detrend,
    findPeaks,
    movingAverage,
    normalize,
} from "./signal-processing";

/**
 * Interface for camera frame data
 */
export interface FrameData {
    width: number;
    height: number;
    data: Uint8Array;
}

/**
 * HeartbeatDetector class
 * Processes camera frames to detect heartbeats and calculate BPM
 */
export class HeartbeatDetector {
    // Buffer for storing red channel values
    private frameBuffer: number[] = [];

    // Timestamps for each frame
    private timestamps: number[] = [];

    // Latest calculated BPM
    private lastBpm: number | null = null;

    // Callback for peak detection
    private onPeakDetectedCallback: (() => void) | null = null;

    // Minimum number of frames required for processing
    private readonly minFramesRequired = 100;

    // Maximum buffer time in milliseconds (10 seconds)
    private readonly maxBufferTimeMs = 10000;

    // Window size for moving average filter
    private readonly movingAverageWindow = 5;

    // Minimum distance between peaks (in frames)
    private readonly minPeakDistance = 10;

    // Minimum and maximum valid BPM values
    private readonly minValidBpm = 40;
    private readonly maxValidBpm = 200;

    /**
     * Set callback for peak detection
     * @param callback Function to call when a peak is detected
     */
    setOnPeakDetectedCallback(callback: () => void): void {
        this.onPeakDetectedCallback = callback;
    }

    /**
     * Process frame data from camera
     * @param frameData Camera frame data
     */
    processFrame(frameData: FrameData): void {
        // 1. Extract average red channel value
        const redAverage = this.extractRedChannelAverage(frameData);

        // 2. Add to buffer
        this.frameBuffer.push(redAverage);
        this.timestamps.push(Date.now());

        // 3. Manage buffer size
        this.manageBufferSize();

        // 4. Process data if we have enough samples
        if (this.minFramesRequired <= this.frameBuffer.length) {
            this.processBufferedData();
        }
    }

    /**
     * Get the current BPM value
     * @returns Current BPM or null if not available
     */
    getBPM(): number | null {
        return this.lastBpm;
    }

    /**
     * Reset the detector
     * Clears all buffers and resets the BPM value
     */
    reset(): void {
        this.frameBuffer = [];
        this.timestamps = [];
        this.lastBpm = null;
    }

    /**
     * Extract average red channel value from frame
     * @param frameData Camera frame data
     * @returns Average red channel value
     */
    private extractRedChannelAverage(frameData: FrameData): number {
        const { width, height, data } = frameData;

        // Calculate the center region of the image (middle 50%)
        const startX = Math.floor(width * 0.25);
        const endX = Math.floor(width * 0.75);
        const startY = Math.floor(height * 0.25);
        const endY = Math.floor(height * 0.75);

        let redSum = 0;
        let pixelCount = 0;

        // Iterate through the center region
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // Calculate the pixel index
                // Each pixel has 4 values: R, G, B, A
                const pixelIndex = (y * width + x) * 4;

                // Get the red channel value (index 0)
                const redValue = data[pixelIndex];

                redSum += redValue;
                pixelCount++;
            }
        }

        // Return the average red value
        return 0 < pixelCount ? redSum / pixelCount : 0;
    }

    /**
     * Process buffered data to detect heartbeats
     */
    private processBufferedData(): void {
        // Skip if buffer is too small
        if (this.frameBuffer.length < this.minFramesRequired) return;

        // 1. Apply signal processing
        const processedData = this.processSignal(this.frameBuffer);

        // 2. Detect peaks
        const peakIndices = findPeaks(
            processedData,
            undefined, // No minimum height
            this.minPeakDistance,
        );

        // 3. Calculate BPM if we have enough peaks
        if (2 <= peakIndices.length) {
            const calculatedBpm = this.calculateBPM(peakIndices);

            // Update BPM if it's valid
            if (this.isValidBpm(calculatedBpm)) {
                this.lastBpm = calculatedBpm;
            }

            // Trigger callback if a new peak was detected at the end of the buffer
            const lastPeakIndex = peakIndices[peakIndices.length - 1];
            const isRecentPeak = processedData.length - lastPeakIndex < 5;

            if (this.onPeakDetectedCallback && isRecentPeak) {
                this.onPeakDetectedCallback();
            }
        }
    }

    /**
     * Apply signal processing to the buffer
     * @param buffer Input signal buffer
     * @returns Processed signal
     */
    private processSignal(buffer: number[]): number[] {
        // 1. Apply moving average filter to remove noise
        let processed = movingAverage(buffer, this.movingAverageWindow);

        // 2. Apply detrending to remove signal trend
        processed = detrend(processed);

        // 3. Apply bandpass filter to isolate heart rate frequencies
        // Typical heart rate is 40-200 BPM (0.67-3.33 Hz)
        processed = bandpassFilter(processed, 10, 3);

        // 4. Normalize the signal
        processed = normalize(processed);

        return processed;
    }

    /**
     * Calculate BPM from peak indices
     * @param peakIndices Indices of detected peaks
     * @returns Calculated BPM
     */
    private calculateBPM(peakIndices: number[]): number {
        // Calculate time differences between peaks
        const timeDiffs: number[] = [];

        for (let i = 1; i < peakIndices.length; i++) {
            const currentPeakIndex = peakIndices[i];
            const prevPeakIndex = peakIndices[i - 1];

            // Get timestamps for these indices
            const currentTime = this.timestamps[currentPeakIndex];
            const prevTime = this.timestamps[prevPeakIndex];

            // Calculate time difference in milliseconds
            const timeDiff = currentTime - prevTime;

            if (0 < timeDiff) {
                timeDiffs.push(timeDiff);
            }
        }

        // Skip if no valid time differences
        if (timeDiffs.length === 0) return 0;

        // Calculate average time between peaks
        const avgTimeBetweenPeaks =
            timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;

        // Convert to BPM: 60000 ms / avg time between peaks in ms
        const bpm = 60000 / avgTimeBetweenPeaks;

        return bpm;
    }

    /**
     * Check if BPM is in a valid range
     * @param bpm BPM value to check
     * @returns True if BPM is valid
     */
    private isValidBpm(bpm: number): boolean {
        return this.minValidBpm <= bpm && bpm <= this.maxValidBpm;
    }

    /**
     * Manage buffer size to keep only recent data
     */
    private manageBufferSize(): void {
        const currentTime = Date.now();

        // Remove data older than maxBufferTimeMs
        while (
            0 < this.timestamps.length &&
            this.maxBufferTimeMs < currentTime - this.timestamps[0]
        ) {
            this.frameBuffer.shift();
            this.timestamps.shift();
        }
    }

    /**
     * Get the current buffer for debugging
     * @returns Copy of the current frame buffer
     */
    getBuffer(): number[] {
        return [...this.frameBuffer];
    }
}
