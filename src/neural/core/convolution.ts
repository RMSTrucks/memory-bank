/**
 * Convolution Operations
 *
 * This file implements convolution operations for the Neural Computation Framework.
 * It provides 2D convolution, max pooling, and average pooling operations.
 */

import { v4 as uuidv4 } from 'uuid';
import {
    DataType,
    Shape,
    Tensor,
    TensorOpType,
    TensorOpResult,
    TensorOpPerformance
} from '../types/tensor';
import {
    PaddingType,
    DataFormat,
    Conv2DParams,
    MaxPool2DParams,
    AvgPool2DParams,
    calculateConv2DOutputShape,
    calculatePoolingOutputShape,
    calculatePadding,
    im2col,
    col2im
} from '../types/convolution';
import { createTensor, shapeUtils, trackPerformance } from './tensor';

/**
 * 2D Convolution operation
 * @param input Input tensor
 * @param filters Filter tensor
 * @param strides Strides [strideHeight, strideWidth]
 * @param padding Padding type
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 * @param dilationRate Dilation rate [dilationHeight, dilationWidth]
 * @param useBias Whether to use bias
 * @param bias Bias tensor (if useBias is true)
 * @param groups Number of groups for grouped convolution
 */
export function conv2d(
    input: Tensor,
    filters: Tensor,
    strides: [number, number] = [1, 1],
    padding: PaddingType = 'valid',
    dataFormat: DataFormat = 'NHWC',
    dilationRate: [number, number] = [1, 1],
    useBias: boolean = false,
    bias?: Tensor,
    groups: number = 1
): TensorOpResult {
    const start = globalThis.performance.now();

    // Extract dimensions
    const inputShape = input.shape;
    const filterShape = filters.shape;

    // Validate input and filter shapes
    if (inputShape.length !== 4) {
        throw new Error(`Input tensor must be 4D, got shape ${inputShape}`);
    }

    if (filterShape.length !== 4) {
        throw new Error(`Filter tensor must be 4D, got shape ${filterShape}`);
    }

    // Extract dimensions based on data format
    let inputBatch: number, inputHeight: number, inputWidth: number, inputChannels: number;

    if (dataFormat === 'NHWC') {
        [inputBatch, inputHeight, inputWidth, inputChannels] = inputShape;
    } else { // 'NCHW'
        [inputBatch, inputChannels, inputHeight, inputWidth] = inputShape;
    }

    const [filterHeight, filterWidth, filterInputChannels, filterOutputChannels] = filterShape;

    // Validate channel dimensions
    if (filterInputChannels * groups !== inputChannels) {
        throw new Error(`Filter input channels (${filterInputChannels} * ${groups}) must match input channels (${inputChannels})`);
    }

    // Calculate output shape
    const outputShape = calculateConv2DOutputShape(
        inputShape,
        filterShape,
        strides,
        padding,
        dataFormat,
        dilationRate
    );

    // Calculate padding values
    const [paddingTop, paddingBottom] = calculatePadding(
        inputHeight,
        filterHeight,
        strides[0],
        padding,
        dilationRate[0]
    );

    const [paddingLeft, paddingRight] = calculatePadding(
        inputWidth,
        filterWidth,
        strides[1],
        padding,
        dilationRate[1]
    );

    // Convert input to NHWC format if needed
    const inputArray = input.toArray();
    let inputData: number[][][][] = [];

    if (dataFormat === 'NCHW') {
        // Convert from [batch, channels, height, width] to [batch, height, width, channels]
        for (let b = 0; b < inputBatch; b++) {
            inputData[b] = [];
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = [];
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = [];
                    for (let c = 0; c < inputChannels; c++) {
                        // Access the flattened array with proper indexing
                        const flatIndex = b * (inputChannels * inputHeight * inputWidth) +
                                         c * (inputHeight * inputWidth) +
                                         h * inputWidth +
                                         w;
                        inputData[b][h][w][c] = inputArray[flatIndex];
                    }
                }
            }
        }
    } else {
        // Already in NHWC format, reshape the flattened array
        for (let b = 0; b < inputBatch; b++) {
            inputData[b] = [];
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = [];
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = [];
                    for (let c = 0; c < inputChannels; c++) {
                        const flatIndex = b * (inputHeight * inputWidth * inputChannels) +
                                         h * (inputWidth * inputChannels) +
                                         w * inputChannels +
                                         c;
                        inputData[b][h][w][c] = inputArray[flatIndex];
                    }
                }
            }
        }
    }

    // Convert filters to array and reshape
    const filtersArray = filters.toArray();
    const filtersData: number[][][][] = [];

    for (let h = 0; h < filterHeight; h++) {
        filtersData[h] = [];
        for (let w = 0; w < filterWidth; w++) {
            filtersData[h][w] = [];
            for (let inC = 0; inC < filterInputChannels; inC++) {
                filtersData[h][w][inC] = [];
                for (let outC = 0; outC < filterOutputChannels; outC++) {
                    const flatIndex = h * (filterWidth * filterInputChannels * filterOutputChannels) +
                                     w * (filterInputChannels * filterOutputChannels) +
                                     inC * filterOutputChannels +
                                     outC;
                    filtersData[h][w][inC][outC] = filtersArray[flatIndex];
                }
            }
        }
    }

    // Initialize output data
    const outputData: number[][][][] = [];
    const channelsPerGroup = inputChannels / groups;
    const outputChannelsPerGroup = filterOutputChannels / groups;

    // Initialize output tensor
    let outputHeight: number, outputWidth: number;
    if (dataFormat === 'NHWC') {
        [, outputHeight, outputWidth] = outputShape;
    } else { // 'NCHW'
        [, , outputHeight, outputWidth] = outputShape;
    }

    for (let b = 0; b < inputBatch; b++) {
        outputData[b] = [];
        for (let h = 0; h < outputHeight; h++) {
            outputData[b][h] = [];
            for (let w = 0; w < outputWidth; w++) {
                outputData[b][h][w] = new Array(filterOutputChannels).fill(0);
            }
        }
    }

    // Perform convolution for each group
    for (let g = 0; g < groups; g++) {
        // Extract input and filter data for this group
        const groupInputChannelStart = g * channelsPerGroup;
        const groupOutputChannelStart = g * outputChannelsPerGroup;

        // Use im2col for efficient convolution
        const cols = im2col(
            inputData,
            filterHeight,
            filterWidth,
            strides,
            [paddingTop, paddingBottom, paddingLeft, paddingRight],
            'NHWC', // im2col always uses NHWC internally
            dilationRate
        );

        // Reshape filters for matrix multiplication
        const reshapedFilters: number[][] = [];
        for (let outC = 0; outC < outputChannelsPerGroup; outC++) {
            reshapedFilters[outC] = [];
            for (let inC = 0; inC < channelsPerGroup; inC++) {
                for (let fh = 0; fh < filterHeight; fh++) {
                    for (let fw = 0; fw < filterWidth; fw++) {
                        reshapedFilters[outC].push(filtersData[fh][fw][inC + groupInputChannelStart][outC + groupOutputChannelStart]);
                    }
                }
            }
        }

        // Perform matrix multiplication
        const result: number[][] = [];
        for (let outC = 0; outC < outputChannelsPerGroup; outC++) {
            result[outC] = [];
            for (let col = 0; col < cols[0].length; col++) {
                let sum = 0;
                for (let i = 0; i < reshapedFilters[outC].length; i++) {
                    sum += reshapedFilters[outC][i] * cols[i][col];
                }
                result[outC][col] = sum;
            }
        }

        // Reshape result back to output tensor
        let colIdx = 0;
        for (let b = 0; b < inputBatch; b++) {
            for (let h = 0; h < outputHeight; h++) {
                for (let w = 0; w < outputWidth; w++) {
                    for (let outC = 0; outC < outputChannelsPerGroup; outC++) {
                        outputData[b][h][w][outC + groupOutputChannelStart] = result[outC][colIdx];
                    }
                    colIdx++;
                }
            }
        }
    }

    // Add bias if needed
    if (useBias && bias) {
        const biasData = bias.toArray();
        for (let b = 0; b < inputBatch; b++) {
            for (let h = 0; h < outputHeight; h++) {
                for (let w = 0; w < outputWidth; w++) {
                    for (let c = 0; c < filterOutputChannels; c++) {
                        outputData[b][h][w][c] += biasData[c];
                    }
                }
            }
        }
    }

    // Convert to NCHW format if needed
    let finalOutputData: number[][][][] = outputData;
    if (dataFormat === 'NCHW') {
        finalOutputData = [];
        for (let b = 0; b < inputBatch; b++) {
            finalOutputData[b] = [];
            for (let c = 0; c < filterOutputChannels; c++) {
                finalOutputData[b][c] = [];
                for (let h = 0; h < outputHeight; h++) {
                    finalOutputData[b][c][h] = [];
                    for (let w = 0; w < outputWidth; w++) {
                        finalOutputData[b][c][h][w] = outputData[b][h][w][c];
                    }
                }
            }
        }
    }

    // Flatten output data for tensor creation
    const flattenedOutput: number[] = [];
    const dataToFlatten = dataFormat === 'NHWC' ? outputData : finalOutputData;

    if (dataFormat === 'NHWC') {
        for (let b = 0; b < inputBatch; b++) {
            for (let h = 0; h < outputHeight; h++) {
                for (let w = 0; w < outputWidth; w++) {
                    for (let c = 0; c < filterOutputChannels; c++) {
                        flattenedOutput.push(dataToFlatten[b][h][w][c]);
                    }
                }
            }
        }
    } else { // 'NCHW'
        for (let b = 0; b < inputBatch; b++) {
            for (let c = 0; c < filterOutputChannels; c++) {
                for (let h = 0; h < outputHeight; h++) {
                    for (let w = 0; w < outputWidth; w++) {
                        flattenedOutput.push(dataToFlatten[b][c][h][w]);
                    }
                }
            }
        }
    }

    // Create output tensor
    const outputTensor = createTensor({
        shape: outputShape,
        dtype: input.dtype,
        values: flattenedOutput
    });

    // Create params object for tracking
    const params: Conv2DParams = {
        filters: [[]], // Simplified representation
        numFilters: filterOutputChannels,
        strides,
        padding,
        useBias,
        dataFormat,
        dilationRate,
        groups
    };

    if (useBias && bias) {
        params.bias = bias.toArray();
    }

    // Track performance
    const inputs: Record<string, Tensor> = { input, filters };
    if (bias) {
        inputs.bias = bias;
    }

    return trackPerformance(
        start,
        TensorOpType.CONV2D,
        outputTensor,
        inputs,
        params
    );
}

/**
 * 2D Max Pooling operation
 * @param input Input tensor
 * @param poolSize Pool size [poolHeight, poolWidth]
 * @param strides Strides [strideHeight, strideWidth]
 * @param padding Padding type
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 */
export function maxPool2d(
    input: Tensor,
    poolSize: [number, number] = [2, 2],
    strides: [number, number] = [2, 2],
    padding: PaddingType = 'valid',
    dataFormat: DataFormat = 'NHWC'
): TensorOpResult {
    const start = globalThis.performance.now();

    // Extract dimensions
    const inputShape = input.shape;

    // Validate input shape
    if (inputShape.length !== 4) {
        throw new Error(`Input tensor must be 4D, got shape ${inputShape}`);
    }

    // Extract dimensions based on data format
    let inputBatch: number, inputHeight: number, inputWidth: number, inputChannels: number;

    if (dataFormat === 'NHWC') {
        [inputBatch, inputHeight, inputWidth, inputChannels] = inputShape;
    } else { // 'NCHW'
        [inputBatch, inputChannels, inputHeight, inputWidth] = inputShape;
    }

    // Calculate output shape
    const outputShape = calculatePoolingOutputShape(
        inputShape,
        poolSize,
        strides,
        padding,
        dataFormat
    );

    // Calculate padding values
    const [paddingTop, paddingBottom] = calculatePadding(
        inputHeight,
        poolSize[0],
        strides[0],
        padding
    );

    const [paddingLeft, paddingRight] = calculatePadding(
        inputWidth,
        poolSize[1],
        strides[1],
        padding
    );

    // Convert input to NHWC format if needed
    const inputArray = input.toArray();
    let inputData: number[][][][] = [];

    if (dataFormat === 'NCHW') {
        // Convert from [batch, channels, height, width] to [batch, height, width, channels]
        for (let b = 0; b < inputBatch; b++) {
            inputData[b] = [];
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = [];
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = [];
                    for (let c = 0; c < inputChannels; c++) {
                        // Access the flattened array with proper indexing
                        const flatIndex = b * (inputChannels * inputHeight * inputWidth) +
                                         c * (inputHeight * inputWidth) +
                                         h * inputWidth +
                                         w;
                        inputData[b][h][w][c] = inputArray[flatIndex];
                    }
                }
            }
        }
    } else {
        // Already in NHWC format, reshape the flattened array
        for (let b = 0; b < inputBatch; b++) {
            inputData[b] = [];
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = [];
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = [];
                    for (let c = 0; c < inputChannels; c++) {
                        const flatIndex = b * (inputHeight * inputWidth * inputChannels) +
                                         h * (inputWidth * inputChannels) +
                                         w * inputChannels +
                                         c;
                        inputData[b][h][w][c] = inputArray[flatIndex];
                    }
                }
            }
        }
    }

    // Calculate output dimensions
    let outputHeight: number, outputWidth: number;
    if (dataFormat === 'NHWC') {
        [, outputHeight, outputWidth] = outputShape;
    } else { // 'NCHW'
        [, , outputHeight, outputWidth] = outputShape;
    }

    // Initialize output tensor
    const outputData: number[][][][] = [];
    for (let b = 0; b < inputBatch; b++) {
        outputData[b] = [];
        for (let h = 0; h < outputHeight; h++) {
            outputData[b][h] = [];
            for (let w = 0; w < outputWidth; w++) {
                outputData[b][h][w] = new Array(inputChannels).fill(0);
            }
        }
    }

    // Perform max pooling
    for (let b = 0; b < inputBatch; b++) {
        for (let h = 0; h < outputHeight; h++) {
            for (let w = 0; w < outputWidth; w++) {
                for (let c = 0; c < inputChannels; c++) {
                    // Calculate input region for this output pixel
                    const hStart = h * strides[0] - paddingTop;
                    const wStart = w * strides[1] - paddingLeft;
                    const hEnd = Math.min(hStart + poolSize[0], inputHeight);
                    const wEnd = Math.min(wStart + poolSize[1], inputWidth);
                    const hStartClamped = Math.max(0, hStart);
                    const wStartClamped = Math.max(0, wStart);

                    // Find maximum value in the region
                    let maxVal = -Infinity;
                    for (let ih = hStartClamped; ih < hEnd; ih++) {
                        for (let iw = wStartClamped; iw < wEnd; iw++) {
                            maxVal = Math.max(maxVal, inputData[b][ih][iw][c]);
                        }
                    }

                    outputData[b][h][w][c] = maxVal;
                }
            }
        }
    }

    // Convert to NCHW format if needed
    let finalOutputData: number[][][][] = outputData;
    if (dataFormat === 'NCHW') {
        finalOutputData = [];
        for (let b = 0; b < inputBatch; b++) {
            finalOutputData[b] = [];
            for (let c = 0; c < inputChannels; c++) {
                finalOutputData[b][c] = [];
                for (let h = 0; h < outputHeight; h++) {
                    finalOutputData[b][c][h] = [];
                    for (let w = 0; w < outputWidth; w++) {
                        finalOutputData[b][c][h][w] = outputData[b][h][w][c];
                    }
                }
            }
        }
    }

    // Flatten output data for tensor creation
    const flattenedOutput: number[] = [];
    const dataToFlatten = dataFormat === 'NHWC' ? outputData : finalOutputData;

    if (dataFormat === 'NHWC') {
        for (let b = 0; b < inputBatch; b++) {
            for (let h = 0; h < outputHeight; h++) {
                for (let w = 0; w < outputWidth; w++) {
                    for (let c = 0; c < inputChannels; c++) {
                        flattenedOutput.push(dataToFlatten[b][h][w][c]);
                    }
                }
            }
        }
    } else { // 'NCHW'
        for (let b = 0; b < inputBatch; b++) {
            for (let c = 0; c < inputChannels; c++) {
                for (let h = 0; h < outputHeight; h++) {
                    for (let w = 0; w < outputWidth; w++) {
                        flattenedOutput.push(dataToFlatten[b][c][h][w]);
                    }
                }
            }
        }
    }

    // Create output tensor
    const outputTensor = createTensor({
        shape: outputShape,
        dtype: input.dtype,
        values: flattenedOutput
    });

    // Create params object for tracking
    const params: MaxPool2DParams = {
        poolSize,
        strides,
        padding,
        dataFormat
    };

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.MAX_POOL2D,
        outputTensor,
        { input },
        params
    );
}

/**
 * 2D Average Pooling operation
 * @param input Input tensor
 * @param poolSize Pool size [poolHeight, poolWidth]
 * @param strides Strides [strideHeight, strideWidth]
 * @param padding Padding type
 * @param dataFormat Data format ('NHWC' or 'NCHW')
 */
export function avgPool2d(
    input: Tensor,
    poolSize: [number, number] = [2, 2],
    strides: [number, number] = [2, 2],
    padding: PaddingType = 'valid',
    dataFormat: DataFormat = 'NHWC'
): TensorOpResult {
    const start = globalThis.performance.now();

    // Extract dimensions
    const inputShape = input.shape;

    // Validate input shape
    if (inputShape.length !== 4) {
        throw new Error(`Input tensor must be 4D, got shape ${inputShape}`);
    }

    // Extract dimensions based on data format
    let inputBatch: number, inputHeight: number, inputWidth: number, inputChannels: number;

    if (dataFormat === 'NHWC') {
        [inputBatch, inputHeight, inputWidth, inputChannels] = inputShape;
    } else { // 'NCHW'
        [inputBatch, inputChannels, inputHeight, inputWidth] = inputShape;
    }

    // Calculate output shape
    const outputShape = calculatePoolingOutputShape(
        inputShape,
        poolSize,
        strides,
        padding,
        dataFormat
    );

    // Calculate padding values
    const [paddingTop, paddingBottom] = calculatePadding(
        inputHeight,
        poolSize[0],
        strides[0],
        padding
    );

    const [paddingLeft, paddingRight] = calculatePadding(
        inputWidth,
        poolSize[1],
        strides[1],
        padding
    );

    // Convert input to NHWC format if needed
    const inputArray = input.toArray();
    let inputData: number[][][][] = [];

    if (dataFormat === 'NCHW') {
        // Convert from [batch, channels, height, width] to [batch, height, width, channels]
        for (let b = 0; b < inputBatch; b++) {
            inputData[b] = [];
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = [];
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = [];
                    for (let c = 0; c < inputChannels; c++) {
                        // Access the flattened array with proper indexing
                        const flatIndex = b * (inputChannels * inputHeight * inputWidth) +
                                         c * (inputHeight * inputWidth) +
                                         h * inputWidth +
                                         w;
                        inputData[b][h][w][c] = inputArray[flatIndex];
                    }
                }
            }
        }
    } else {
        // Already in NHWC format, reshape the flattened array
        for (let b = 0; b < inputBatch; b++) {
            inputData[b] = [];
            for (let h = 0; h < inputHeight; h++) {
                inputData[b][h] = [];
                for (let w = 0; w < inputWidth; w++) {
                    inputData[b][h][w] = [];
                    for (let c = 0; c < inputChannels; c++) {
                        const flatIndex = b * (inputHeight * inputWidth * inputChannels) +
                                         h * (inputWidth * inputChannels) +
                                         w * inputChannels +
                                         c;
                        inputData[b][h][w][c] = inputArray[flatIndex];
                    }
                }
            }
        }
    }

    // Calculate output dimensions
    let outputHeight: number, outputWidth: number;
    if (dataFormat === 'NHWC') {
        [, outputHeight, outputWidth] = outputShape;
    } else { // 'NCHW'
        [, , outputHeight, outputWidth] = outputShape;
    }

    // Initialize output tensor
    const outputData: number[][][][] = [];
    for (let b = 0; b < inputBatch; b++) {
        outputData[b] = [];
        for (let h = 0; h < outputHeight; h++) {
            outputData[b][h] = [];
            for (let w = 0; w < outputWidth; w++) {
                outputData[b][h][w] = new Array(inputChannels).fill(0);
            }
        }
    }

    // Perform average pooling
    for (let b = 0; b < inputBatch; b++) {
        for (let h = 0; h < outputHeight; h++) {
            for (let w = 0; w < outputWidth; w++) {
                for (let c = 0; c < inputChannels; c++) {
                    // Calculate input region for this output pixel
                    const hStart = h * strides[0] - paddingTop;
                    const wStart = w * strides[1] - paddingLeft;
                    const hEnd = Math.min(hStart + poolSize[0], inputHeight);
                    const wEnd = Math.min(wStart + poolSize[1], inputWidth);
                    const hStartClamped = Math.max(0, hStart);
                    const wStartClamped = Math.max(0, wStart);

                    // Calculate average value in the region
                    let sum = 0;
                    let count = 0;
                    for (let ih = hStartClamped; ih < hEnd; ih++) {
                        for (let iw = wStartClamped; iw < wEnd; iw++) {
                            sum += inputData[b][ih][iw][c];
                            count++;
                        }
                    }

                    outputData[b][h][w][c] = count > 0 ? sum / count : 0;
                }
            }
        }
    }

    // Convert to NCHW format if needed
    let finalOutputData: number[][][][] = outputData;
    if (dataFormat === 'NCHW') {
        finalOutputData = [];
        for (let b = 0; b < inputBatch; b++) {
            finalOutputData[b] = [];
            for (let c = 0; c < inputChannels; c++) {
                finalOutputData[b][c] = [];
                for (let h = 0; h < outputHeight; h++) {
                    finalOutputData[b][c][h] = [];
                    for (let w = 0; w < outputWidth; w++) {
                        finalOutputData[b][c][h][w] = outputData[b][h][w][c];
                    }
                }
            }
        }
    }

    // Flatten output data for tensor creation
    const flattenedOutput: number[] = [];
    const dataToFlatten = dataFormat === 'NHWC' ? outputData : finalOutputData;

    if (dataFormat === 'NHWC') {
        for (let b = 0; b < inputBatch; b++) {
            for (let h = 0; h < outputHeight; h++) {
                for (let w = 0; w < outputWidth; w++) {
                    for (let c = 0; c < inputChannels; c++) {
                        flattenedOutput.push(dataToFlatten[b][h][w][c]);
                    }
                }
            }
        }
    } else { // 'NCHW'
        for (let b = 0; b < inputBatch; b++) {
            for (let c = 0; c < inputChannels; c++) {
                for (let h = 0; h < outputHeight; h++) {
                    for (let w = 0; w < outputWidth; w++) {
                        flattenedOutput.push(dataToFlatten[b][c][h][w]);
                    }
                }
            }
        }
    }

    // Create output tensor
    const outputTensor = createTensor({
        shape: outputShape,
        dtype: input.dtype,
        values: flattenedOutput
    });

    // Create params object for tracking
    const params: AvgPool2DParams = {
        poolSize,
        strides,
        padding,
        dataFormat
    };

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.AVG_POOL2D,
        outputTensor,
        { input },
        params
    );
}
