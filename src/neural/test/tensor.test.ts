/**
 * Tensor Implementation Tests
 *
 * This file contains tests for the tensor implementation in the Neural Computation Framework.
 */

import {
    createTensor,
    zeros,
    ones,
    random,
    fromArray,
    range,
    calculateSize,
    calculateStrides,
    shapeUtils
} from '../core/tensor';

describe('Tensor Creation', () => {
    test('createTensor should create a tensor with the correct shape and values', () => {
        const tensor = createTensor({
            shape: [2, 3],
            values: [1, 2, 3, 4, 5, 6]
        });

        expect(tensor.shape).toEqual([2, 3]);
        expect(tensor.size).toBe(6);
        expect(tensor.rank).toBe(2);
        expect(tensor.dtype).toBe('float32');
        expect(tensor.get(0, 0)).toBe(1);
        expect(tensor.get(0, 1)).toBe(2);
        expect(tensor.get(0, 2)).toBe(3);
        expect(tensor.get(1, 0)).toBe(4);
        expect(tensor.get(1, 1)).toBe(5);
        expect(tensor.get(1, 2)).toBe(6);
    });

    test('zeros should create a tensor filled with zeros', () => {
        const tensor = zeros([2, 2]);

        expect(tensor.shape).toEqual([2, 2]);
        expect(tensor.size).toBe(4);
        expect(tensor.get(0, 0)).toBe(0);
        expect(tensor.get(0, 1)).toBe(0);
        expect(tensor.get(1, 0)).toBe(0);
        expect(tensor.get(1, 1)).toBe(0);
    });

    test('ones should create a tensor filled with ones', () => {
        const tensor = ones([2, 2]);

        expect(tensor.shape).toEqual([2, 2]);
        expect(tensor.size).toBe(4);
        expect(tensor.get(0, 0)).toBe(1);
        expect(tensor.get(0, 1)).toBe(1);
        expect(tensor.get(1, 0)).toBe(1);
        expect(tensor.get(1, 1)).toBe(1);
    });

    test('random should create a tensor with random values in the specified range', () => {
        const tensor = random([2, 2], 'float32', 0, 1);

        expect(tensor.shape).toEqual([2, 2]);
        expect(tensor.size).toBe(4);

        // Check that values are in the range [0, 1)
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const value = tensor.get(i, j);
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThan(1);
            }
        }
    });

    test('fromArray should create a tensor from an array', () => {
        const tensor = fromArray([1, 2, 3, 4], [2, 2]);

        expect(tensor.shape).toEqual([2, 2]);
        expect(tensor.size).toBe(4);
        expect(tensor.get(0, 0)).toBe(1);
        expect(tensor.get(0, 1)).toBe(2);
        expect(tensor.get(1, 0)).toBe(3);
        expect(tensor.get(1, 1)).toBe(4);
    });

    test('range should create a tensor with values in a range', () => {
        const tensor = range(0, 5);

        expect(tensor.shape).toEqual([5]);
        expect(tensor.size).toBe(5);
        expect(tensor.get(0)).toBe(0);
        expect(tensor.get(1)).toBe(1);
        expect(tensor.get(2)).toBe(2);
        expect(tensor.get(3)).toBe(3);
        expect(tensor.get(4)).toBe(4);
    });
});

describe('Tensor Operations', () => {
    test('get should return the correct value', () => {
        const tensor = createTensor({
            shape: [2, 3],
            values: [1, 2, 3, 4, 5, 6]
        });

        expect(tensor.get(0, 0)).toBe(1);
        expect(tensor.get(0, 1)).toBe(2);
        expect(tensor.get(0, 2)).toBe(3);
        expect(tensor.get(1, 0)).toBe(4);
        expect(tensor.get(1, 1)).toBe(5);
        expect(tensor.get(1, 2)).toBe(6);
    });

    test('set should update the value', () => {
        const tensor = createTensor({
            shape: [2, 2],
            values: [1, 2, 3, 4]
        });

        tensor.set(10, 0, 0);
        tensor.set(20, 0, 1);
        tensor.set(30, 1, 0);
        tensor.set(40, 1, 1);

        expect(tensor.get(0, 0)).toBe(10);
        expect(tensor.get(0, 1)).toBe(20);
        expect(tensor.get(1, 0)).toBe(30);
        expect(tensor.get(1, 1)).toBe(40);
    });

    test('get should throw an error for out-of-bounds indices', () => {
        const tensor = createTensor({
            shape: [2, 2],
            values: [1, 2, 3, 4]
        });

        expect(() => tensor.get(2, 0)).toThrow();
        expect(() => tensor.get(0, 2)).toThrow();
        expect(() => tensor.get(-1, 0)).toThrow();
    });

    test('set should throw an error for out-of-bounds indices', () => {
        const tensor = createTensor({
            shape: [2, 2],
            values: [1, 2, 3, 4]
        });

        expect(() => tensor.set(10, 2, 0)).toThrow();
        expect(() => tensor.set(10, 0, 2)).toThrow();
        expect(() => tensor.set(10, -1, 0)).toThrow();
    });
});

describe('Shape Utilities', () => {
    test('calculateSize should return the correct size', () => {
        expect(calculateSize([2, 3])).toBe(6);
        expect(calculateSize([4, 5, 6])).toBe(120);
        expect(calculateSize([10])).toBe(10);
        expect(calculateSize([])).toBe(0);
    });

    test('calculateStrides should return the correct strides', () => {
        expect(calculateStrides([2, 3])).toEqual([3, 1]);
        expect(calculateStrides([4, 5, 6])).toEqual([30, 6, 1]);
        expect(calculateStrides([10])).toEqual([1]);
        expect(calculateStrides([])).toEqual([]);
    });

    test('shapeUtils.areBroadcastable should correctly determine if shapes can be broadcast', () => {
        expect(shapeUtils.areBroadcastable([2, 3], [2, 3])).toBe(true);
        expect(shapeUtils.areBroadcastable([2, 3], [3])).toBe(true);
        expect(shapeUtils.areBroadcastable([2, 3], [1, 3])).toBe(true);
        expect(shapeUtils.areBroadcastable([2, 3], [2, 1])).toBe(true);
        expect(shapeUtils.areBroadcastable([2, 3], [4, 3])).toBe(false);
    });

    test('shapeUtils.broadcastShapes should return the correct broadcasted shape', () => {
        expect(shapeUtils.broadcastShapes([2, 3], [2, 3])).toEqual([2, 3]);
        expect(shapeUtils.broadcastShapes([2, 3], [3])).toEqual([2, 3]);
        expect(shapeUtils.broadcastShapes([2, 3], [1, 3])).toEqual([2, 3]);
        expect(shapeUtils.broadcastShapes([2, 3], [2, 1])).toEqual([2, 3]);
        expect(() => shapeUtils.broadcastShapes([2, 3], [4, 3])).toThrow();
    });

    test('shapeUtils.validateShape should correctly validate shapes', () => {
        expect(shapeUtils.validateShape([2, 3])).toBe(true);
        expect(shapeUtils.validateShape([0])).toBe(true);
        expect(shapeUtils.validateShape([])).toBe(true);
        expect(shapeUtils.validateShape([2.5])).toBe(false);
        expect(shapeUtils.validateShape([-1])).toBe(false);
        expect(shapeUtils.validateShape(['2'] as any)).toBe(false);
    });
});

describe('Tensor Transformations', () => {
    test('reshape should correctly reshape a tensor', () => {
        const tensor = createTensor({
            shape: [2, 3],
            values: [1, 2, 3, 4, 5, 6]
        });

        const reshaped = tensor.reshape([3, 2]);

        expect(reshaped.shape).toEqual([3, 2]);
        expect(reshaped.size).toBe(6);
        expect(reshaped.get(0, 0)).toBe(1);
        expect(reshaped.get(0, 1)).toBe(2);
        expect(reshaped.get(1, 0)).toBe(3);
        expect(reshaped.get(1, 1)).toBe(4);
        expect(reshaped.get(2, 0)).toBe(5);
        expect(reshaped.get(2, 1)).toBe(6);
    });

    test('reshape should throw an error if the new shape has a different size', () => {
        const tensor = createTensor({
            shape: [2, 3],
            values: [1, 2, 3, 4, 5, 6]
        });

        expect(() => tensor.reshape([2, 4])).toThrow();
    });

    test('shapeUtils.reshape should correctly reshape a tensor', () => {
        const tensor = createTensor({
            shape: [2, 3],
            values: [1, 2, 3, 4, 5, 6]
        });

        const reshaped = shapeUtils.reshape(tensor, [3, 2]);

        expect(reshaped.shape).toEqual([3, 2]);
        expect(reshaped.size).toBe(6);
        expect(reshaped.get(0, 0)).toBe(1);
        expect(reshaped.get(0, 1)).toBe(2);
        expect(reshaped.get(1, 0)).toBe(3);
        expect(reshaped.get(1, 1)).toBe(4);
        expect(reshaped.get(2, 0)).toBe(5);
        expect(reshaped.get(2, 1)).toBe(6);
    });
});
