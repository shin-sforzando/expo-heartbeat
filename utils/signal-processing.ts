/**
 * Signal processing utilities for heartbeat detection
 */

/**
 * Apply moving average filter to smooth the signal
 * @param data Input signal array
 * @param windowSize Size of the moving average window
 * @returns Filtered signal
 */
export function movingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
        let sum = 0;
        let count = 0;

        // Sum values within the window
        for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
            sum += data[j];
            count++;
        }

        result.push(sum / count);
    }

    return result;
}

/**
 * Remove trend from signal (detrending)
 * Simple linear detrending implementation
 * @param data Input signal array
 * @returns Detrended signal
 */
export function detrend(data: number[]): number[] {
    if (data.length <= 1) return [...data];

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    // Calculate sums for linear regression
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Remove trend
    const result: number[] = [];
    for (let i = 0; i < n; i++) {
        const trend = slope * i + intercept;
        result.push(data[i] - trend);
    }

    return result;
}

/**
 * Normalize signal to have zero mean and unit variance
 * @param data Input signal array
 * @returns Normalized signal
 */
export function normalize(data: number[]): number[] {
    if (data.length === 0) return [];

    // Calculate mean
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;

    // Calculate standard deviation
    const squaredDiffs = data.map((val) => (val - mean) ** 2);
    const variance =
        squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // Avoid division by zero
    if (stdDev === 0) return data.map(() => 0);

    // Normalize
    return data.map((val) => (val - mean) / stdDev);
}

/**
 * Find peaks in the signal
 * @param data Input signal array
 * @param minHeight Minimum height threshold for peaks (optional)
 * @param minDistance Minimum distance between peaks (optional)
 * @returns Array of indices where peaks were found
 */
export function findPeaks(
    data: number[],
    minHeight?: number,
    minDistance?: number,
): number[] {
    const peaks: number[] = [];

    // Need at least 3 points to find a peak
    if (data.length < 3) return peaks;

    // Detect local maxima
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i - 1] < data[i] && data[i + 1] < data[i]) {
            // Check minimum height constraint
            if (minHeight === undefined || minHeight < data[i]) {
                // Check minimum distance constraint
                if (
                    minDistance === undefined ||
                    peaks.length === 0 ||
                    minDistance <= i - peaks[peaks.length - 1]
                ) {
                    peaks.push(i);
                } else {
                    // If this peak is higher than the last one within minDistance,
                    // replace the last peak with this one
                    if (data[peaks[peaks.length - 1]] < data[i]) {
                        peaks[peaks.length - 1] = i;
                    }
                }
            }
        }
    }

    return peaks;
}

/**
 * Apply bandpass filter to isolate frequencies in a specific range
 * Simple implementation using moving average filters
 * @param data Input signal array
 * @param lowCutSize Window size for low-cut filter (high-pass)
 * @param highCutSize Window size for high-cut filter (low-pass)
 * @returns Filtered signal
 */
export function bandpassFilter(
    data: number[],
    lowCutSize: number,
    highCutSize: number,
): number[] {
    // Apply high-pass filter (remove low frequencies)
    const highPassResult = data.map((val, i) => {
        if (i < lowCutSize) return val;
        return val - data[i - lowCutSize];
    });

    // Apply low-pass filter (remove high frequencies)
    return movingAverage(highPassResult, highCutSize);
}

// For testing purposes (development only)
if (process.env.NODE_ENV === "development") {
    // Example test data
    const testData = [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
    console.log("[DEBUG] Original:", testData);
    console.log(
        "[DEBUG] Moving Average (window=3):",
        movingAverage(testData, 3),
    );
    console.log("[DEBUG] Detrended:", detrend(testData));
    console.log("[DEBUG] Peaks:", findPeaks(testData));
}
