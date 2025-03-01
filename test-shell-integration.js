/**
 * Test script for VSCode shell integration
 *
 * This script outputs some text to the terminal to help verify
 * that shell integration is working properly.
 */

console.log('Shell Integration Test');
console.log('=====================');
console.log('');
console.log('If you can see this output in the terminal, basic output is working.');
console.log('');

// Test ANSI color codes
console.log('\x1b[32mThis text should be green.\x1b[0m');
console.log('\x1b[31mThis text should be red.\x1b[0m');
console.log('\x1b[34mThis text should be blue.\x1b[0m');
console.log('\x1b[33mThis text should be yellow.\x1b[0m');
console.log('');

// Test progress indicator
console.log('Testing progress indicator:');
const progressChars = ['|', '/', '-', '\\'];
let i = 0;

// Output a simple spinner animation
for (let j = 0; j < 20; j++) {
    process.stdout.write(`\r${progressChars[i]} Processing...`);
    i = (i + 1) % progressChars.length;
}

process.stdout.write('\rDone!           \n\n');

console.log('If you can see all the above output with proper colors and animation,');
console.log('then shell integration is working correctly.');
console.log('');
console.log('If you only see plain text or some elements are missing,');
console.log('there may still be issues with shell integration.');
