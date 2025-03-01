/**
 * Convolution Types
 *
 * This file defines the types for convolution operations in the
 * Neural Computation Framework.
 */

/**
 * Padding types for convolution operations
 */
export type PaddingType = 'valid' | 'same' | 'full';

/**
 * Data format for convolution operations
 * - 'NHWC': [batch, height, width, channels] (TensorFlow default)
 * - 'NCHW': [batch, channels, height, width] (PyTorch default)
 */
export type DataFormat = 'NHWC' | 'NCHW';

/**
 * Parameters for 2D convolution operation
 */
export interface Conv2DParams {
    /** Filter/kernel for the convolution */
    filters: number[][];

    /** Number of filters/output channels */
    numFilters: number;

    /** Stride of the convolution in height and width dimensions */
    strides: [number, number];

    /** Padding type */
    padding: PaddingType;

    /** Whether to use bias */
    useBias: boolean;

    /** Bias values (if useBias is true) */
    bias?: number[];

    /** Data format */
    dataFormat: DataFormat;

    /** Dilation rate */
    dilationRate: [number, number];

    /** Groups for grouped convolution */
    groups: number;
}

/**
 * Parameters for 2D max pooling operation
 */
export interface MaxPool2DParams {
    /** Pool size in height and width dimensions */
    poolSize: [number, number];

    /** Stride of the pooling in height and width dimensions */
    strides: [number, number];

    /** Padding type */
    padding: PaddingType;

    /** Data format */
    dataFormat: DataFormat;
}

/**
 * Parameters for 2D average pooling operation
 */
export interface AvgPool2DParams {
    /** Pool size in height and width dimensions */
    poolSize: [number, number];

    /** Stride of the pooling in height and width dimensions */
    strides: [number, number];

    /** Padding type */
    padding: PaddingType;

    /** Data format */
    dataFormat: DataFormat;
}

/**
 * Calculate output shape for convolution operation
 * @param inputShape Input shape [batch, height, width, channels] or [batch, channels, height, width]
 * @param filterShape Filter shape [filterHeight, filterWidth, inputChannels, outputChannels]
 * @param strides Strides [strideHeight, strideWidth]
 * @param padding Padding type
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 * @param dilationRate Dilation rate [dilationHeight, dilationWidth]
 */
export function calculateConv2DOutputShape(
    inputShape: number[],
    filterShape: number[],
    strides: [number, number],
    padding: PaddingType,
    dataFormat: DataFormat = 'NHWC',
    dilationRate: [number, number] = [1, 1]
): number[] {
    // Extract dimensions based on data format
    const batch = inputShape[0];
    let inputHeight: number, inputWidth: number, inputChannels: number;

    if (dataFormat === 'NHWC') {
        inputHeight = inputShape[1];
        inputWidth = inputShape[2];
        inputChannels = inputShape[3];
    } else { // 'NCHW'
        inputChannels = inputShape[1];
        inputHeight = inputShape[2];
        inputWidth = inputShape[3];
    }

    const filterHeight = filterShape[0];
    const filterWidth = filterShape[1];
    const outputChannels = filterShape[3];

    // Calculate effective filter size with dilation
    const effectiveFilterHeight = filterHeight + (filterHeight - 1) * (dilationRate[0] - 1);
    const effectiveFilterWidth = filterWidth + (filterWidth - 1) * (dilationRate[1] - 1);

    // Calculate output dimensions based on padding type
    let outputHeight: number, outputWidth: number;

    if (padding === 'valid') {
        outputHeight = Math.floor((inputHeight - effectiveFilterHeight + strides[0]) / strides[0]);
        outputWidth = Math.floor((inputWidth - effectiveFilterWidth + strides[1]) / strides[1]);
    } else if (padding === 'same') {
        outputHeight = Math.ceil(inputHeight / strides[0]);
        outputWidth = Math.ceil(inputWidth / strides[1]);
    } else { // 'full'
        outputHeight = Math.floor((inputHeight + effectiveFilterHeight - 1 + strides[0]) / strides[0]);
        outputWidth = Math.floor((inputWidth + effectiveFilterWidth - 1 + strides[1]) / strides[1]);
    }

    // Return output shape based on data format
    if (dataFormat === 'NHWC') {
        return [batch, outputHeight, outputWidth, outputChannels];
    } else { // 'NCHW'
        return [batch, outputChannels, outputHeight, outputWidth];
    }
}

/**
 * Calculate output shape for pooling operation
 * @param inputShape Input shape [batch, height, width, channels] or [batch, channels, height, width]
 * @param poolSize Pool size [poolHeight, poolWidth]
 * @param strides Strides [strideHeight, strideWidth]
 * @param padding Padding type
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 */
export function calculatePoolingOutputShape(
    inputShape: number[],
    poolSize: [number, number],
    strides: [number, number],
    padding: PaddingType,
    dataFormat: DataFormat = 'NHWC'
): number[] {
    // Extract dimensions based on data format
    const batch = inputShape[0];
    let inputHeight: number, inputWidth: number, channels: number;

    if (dataFormat === 'NHWC') {
        inputHeight = inputShape[1];
        inputWidth = inputShape[2];
        channels = inputShape[3];
    } else { // 'NCHW'
        channels = inputShape[1];
        inputHeight = inputShape[2];
        inputWidth = inputShape[3];
    }

    // Calculate output dimensions based on padding type
    let outputHeight: number, outputWidth: number;

    if (padding === 'valid') {
        outputHeight = Math.floor((inputHeight - poolSize[0] + strides[0]) / strides[0]);
        outputWidth = Math.floor((inputWidth - poolSize[1] + strides[1]) / strides[1]);
    } else if (padding === 'same') {
        outputHeight = Math.ceil(inputHeight / strides[0]);
        outputWidth = Math.ceil(inputWidth / strides[1]);
    } else { // 'full'
        outputHeight = Math.floor((inputHeight + poolSize[0] - 1 + strides[0]) / strides[0]);
        outputWidth = Math.floor((inputWidth + poolSize[1] - 1 + strides[1]) / strides[1]);
    }

    // Return output shape based on data format
    if (dataFormat === 'NHWC') {
        return [batch, outputHeight, outputWidth, channels];
    } else { // 'NCHW'
        return [batch, channels, outputHeight, outputWidth];
    }
}

/**
 * Calculate padding for convolution or pooling operation
 * @param inputSize Input size (height or width)
 * @param filterSize Filter size (height or width)
 * @param stride Stride (height or width)
 * @param paddingType Padding type
 * @param dilationRate Dilation rate (default: 1)
 */
export function calculatePadding(
    inputSize: number,
    filterSize: number,
    stride: number,
    paddingType: PaddingType,
    dilationRate: number = 1
): [number, number] {
    // Calculate effective filter size with dilation
    const effectiveFilterSize = filterSize + (filterSize - 1) * (dilationRate - 1);

    if (paddingType === 'valid') {
        return [0, 0];
    } else if (paddingType === 'same') {
        const totalPadding = Math.max(0, (Math.ceil(inputSize / stride) - 1) * stride + effectiveFilterSize - inputSize);
        const paddingStart = Math.floor(totalPadding / 2);
        const paddingEnd = totalPadding - paddingStart;
        return [paddingStart, paddingEnd];
    } else { // 'full'
        return [effectiveFilterSize - 1, effectiveFilterSize - 1];
    }
}

/**
 * Im2col transformation for efficient convolution
 * Transforms input tensor into a 2D matrix where each column corresponds to a convolution window
 * @param input Input tensor
 * @param filterHeight Filter height
 * @param filterWidth Filter width
 * @param stride Stride [strideHeight, strideWidth]
 * @param padding Padding [paddingTop, paddingBottom, paddingLeft, paddingRight]
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 * @param dilationRate Dilation rate [dilationHeight, dilationWidth]
 */
export function im2col(
    input: number[][][][], // 4D tensor [batch, height, width, channels] or [batch, channels, height, width]
    filterHeight: number,
    filterWidth: number,
    stride: [number, number],
    padding: [number, number, number, number], // [paddingTop, paddingBottom, paddingLeft, paddingRight]
    dataFormat: DataFormat = 'NHWC',
    dilationRate: [number, number] = [1, 1]
): number[][] {
    const batch = input.length;
    let inputHeight: number, inputWidth: number, inputChannels: number;
    let inputData: number[][][][];

    if (dataFormat === 'NHWC') {
        inputHeight = input[0].length;
        inputWidth = input[0][0].length;
        inputChannels = input[0][0][0].length;
        inputData = input;
    } else { // 'NCHW'
        inputChannels = input[0].length;
        inputHeight = input[0][0].length;
        inputWidth = input[0][0][0].length;
        // Convert NCHW to NHWC for easier processing
        inputData = new Array(batch);
        for (let b = 0; b < batch; b++) {
            inputData[b] = new Array(inputHeight);
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = new Array(inputWidth);
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = new Array(inputChannels);
                    for (let c = 0; c < inputChannels; c++) {
                        inputData[b][h][w][c] = input[b][c][h][w];
                    }
                }
            }
        }
    }

    // Calculate output dimensions
    const paddedHeight = inputHeight + padding[0] + padding[1];
    const paddedWidth = inputWidth + padding[2] + padding[3];
    const outputHeight = Math.floor((paddedHeight - filterHeight * dilationRate[0] + dilationRate[0] - 1) / stride[0]) + 1;
    const outputWidth = Math.floor((paddedWidth - filterWidth * dilationRate[1] + dilationRate[1] - 1) / stride[1]) + 1;

    // Calculate number of elements in each convolution window
    const windowSize = filterHeight * filterWidth * inputChannels;

    // Calculate total number of windows
    const numWindows = batch * outputHeight * outputWidth;

    // Initialize result matrix
    const result: number[][] = new Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
        result[i] = new Array(numWindows).fill(0);
    }

    // Fill the result matrix
    let windowIdx = 0;
    for (let b = 0; b < batch; b++) {
        for (let outY = 0; outY < outputHeight; outY++) {
            for (let outX = 0; outX < outputWidth; outX++) {
                let colIdx = 0;
                for (let c = 0; c < inputChannels; c++) {
                    for (let filterY = 0; filterY < filterHeight; filterY++) {
                        for (let filterX = 0; filterX < filterWidth; filterX++) {
                            const inY = outY * stride[0] + filterY * dilationRate[0] - padding[0];
                            const inX = outX * stride[1] + filterX * dilationRate[1] - padding[2];

                            if (inY >= 0 && inY < inputHeight && inX >= 0 && inX < inputWidth) {
                                result[colIdx][windowIdx] = inputData[b][inY][inX][c];
                            }
                            colIdx++;
                        }
                    }
                }
                windowIdx++;
            }
        }
    }

    return result;
}

/**
 * Col2im transformation for convolution backpropagation
 * Transforms a 2D matrix back to a 4D tensor
 * @param cols Column matrix from im2col
 * @param outputShape Output shape [batch, height, width, channels] or [batch, channels, height, width]
 * @param filterHeight Filter height
 * @param filterWidth Filter width
 * @param stride Stride [strideHeight, strideWidth]
 * @param padding Padding [paddingTop, paddingBottom, paddingLeft, paddingRight]
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 * @param dilationRate Dilation rate [dilationHeight, dilationWidth]
 */
export function col2im(
    cols: number[][],
    outputShape: number[],
    filterHeight: number,
    filterWidth: number,
    stride: [number, number],
    padding: [number, number, number, number], // [paddingTop, paddingBottom, paddingLeft, paddingRight]
    dataFormat: DataFormat = 'NHWC',
    dilationRate: [number, number] = [1, 1]
): number[][][][] {
    const batch = outputShape[0];
    let outputHeight: number, outputWidth: number, outputChannels: number;

    if (dataFormat === 'NHWC') {
        outputHeight = outputShape[1];
        outputWidth = outputShape[2];
        outputChannels = outputShape[3];
    } else { // 'NCHW'
        outputChannels = outputShape[1];
        outputHeight = outputShape[2];
        outputWidth = outputShape[3];
    }

    // Initialize result tensor
    const result: number[][][][] = new Array(batch);
    for (let b = 0; b < batch; b++) {
        result[b] = new Array(outputHeight);
        for (let h = 0; h < outputHeight; h++) {
            result[b][h] = new Array(outputWidth);
            for (let w = 0; w < outputWidth; w++) {
                result[b][h][w] = new Array(outputChannels).fill(0);
            }
        }
    }

    // Calculate padded dimensions
    const paddedHeight = outputHeight + padding[0] + padding[1];
    const paddedWidth = outputWidth + padding[2] + padding[3];

    // Calculate dimensions of the convolution output
    const convOutputHeight = Math.floor((paddedHeight - filterHeight * dilationRate[0] + dilationRate[0] - 1) / stride[0]) + 1;
    const convOutputWidth = Math.floor((paddedWidth - filterWidth * dilationRate[1] + dilationRate[1] - 1) / stride[1]) + 1;

    // Calculate number of elements in each convolution window
    const windowSize = filterHeight * filterWidth * outputChannels;

    // Fill the result tensor
    let windowIdx = 0;
    for (let b = 0; b < batch; b++) {
        for (let outY = 0; outY < convOutputHeight; outY++) {
            for (let outX = 0; outX < convOutputWidth; outX++) {
                let colIdx = 0;
                for (let c = 0; c < outputChannels; c++) {
                    for (let filterY = 0; filterY < filterHeight; filterY++) {
                        for (let filterX = 0; filterX < filterWidth; filterX++) {
                            const inY = outY * stride[0] + filterY * dilationRate[0] - padding[0];
                            const inX = outX * stride[1] + filterX * dilationRate[1] - padding[2];

                            if (inY >= 0 && inY < outputHeight && inX >= 0 && inX < outputWidth) {
                                result[b][inY][inX][c] += cols[colIdx][windowIdx];
                            }
                            colIdx++;
                        }
                    }
                }
                windowIdx++;
            }
        }
    }

    // Convert back to NCHW if needed
    if (dataFormat === 'NCHW') {
        const nchwResult: number[][][][] = new Array(batch);
        for (let b = 0; b < batch; b++) {
            nchwResult[b] = new Array(outputChannels);
            for (let c = 0; c < outputChannels; c++) {
                nchwResult[b][c] = new Array(outputHeight);
                for (let h = 0; h < outputHeight; h++) {
                    nchwResult[b][c][h] = new Array(outputWidth);
                    for (let w = 0; w < outputWidth; w++) {
                        nchwResult[b][c][h][w] = result[b][h][w][c];
                    }
                }
            }
        }
        return nchwResult;
    }

    return result;
}
