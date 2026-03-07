# @vcomm/utils

Utility functions for V-COMM voice communication platform.

## Overview

This package provides a comprehensive collection of utility functions used throughout the V-COMM platform. It includes string manipulation, number utilities, array operations, object handling, function helpers, promise utilities, date/time functions, and validation helpers.

## Installation

```bash
npm install @vcomm/utils
```

## Features

### String Utilities
- Random string generation (alphanumeric, numeric, hex)
- UUID and Snowflake ID generation
- Case conversion (camelCase, snake_case, kebab-case, title case)
- Truncation, padding, and escaping

### Number Utilities
- Clamp, range checking, random numbers
- Rounding to decimal places
- Linear interpolation and range mapping
- Byte formatting and duration formatting

### Array Utilities
- Shuffle, unique, groupBy, chunk
- Flatten, take, drop, partition
- Difference, intersection, union
- Zip and unzip

### Object Utilities
- Deep clone and merge
- Pick, omit, map keys/values
- Invert object

### Function Utilities
- Debounce, throttle, memoize
- Once, curry, compose, pipe
- Noop and identity

### Promise Utilities
- Sleep, retry with backoff
- Timeout wrapper
- Parallel execution with concurrency

### Date/Time Utilities
- ISO formatting
- Unix timestamps
- Relative time strings

### Validation Utilities
- Email, URL, UUID, phone validation
- Hex color, IPv4, IPv6 validation

## Usage

### String Utilities

```typescript
import { uuid, snowflake, camelCase, truncate, escapeHtml } from '@vcomm/utils';

// Generate IDs
const id = uuid(); // '550e8400-e29b-41d4-a716-446655440000'
const snowflakeId = snowflake(); // '123456789012345678'

// Case conversion
camelCase('hello-world'); // 'helloWorld'

// Truncate
truncate('Hello World', 8); // 'Hello...'

// Escape HTML
escapeHtml('<script>alert("xss")</script>'); // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

### Number Utilities

```typescript
import { clamp, randomInt, formatBytes, formatDuration } from '@vcomm/utils';

clamp(15, 0, 10); // 10
randomInt(1, 100); // Random integer 1-100
formatBytes(1024 * 1024); // '1.00 MB'
formatDuration(3661000); // '1h 1m'
```

### Array Utilities

```typescript
import { shuffle, unique, groupBy, chunk } from '@vcomm/utils';

shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4]
unique([1, 1, 2, 2, 3]); // [1, 2, 3]

groupBy(['one', 'two', 'three'], s => s.length);
// { 3: ['one', 'two'], 5: ['three'] }

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
```

### Object Utilities

```typescript
import { deepClone, pick, omit, mapValues } from '@vcomm/utils';

const obj = { a: 1, b: 2, c: 3 };
pick(obj, 'a', 'b'); // { a: 1, b: 2 }
omit(obj, 'c'); // { a: 1, b: 2 }
mapValues(obj, v => v * 2); // { a: 2, b: 4, c: 6 }
```

### Function Utilities

```typescript
import { debounce, throttle, memoize, once } from '@vcomm/utils';

// Debounce search input
const debouncedSearch = debounce((query: string) => {
  console.log('Searching:', query);
}, 300);

// Memoize expensive function
const expensive = memoize((n: number) => {
  console.log('Computing...');
  return n * n;
});
expensive(5); // Logs 'Computing...', returns 25
expensive(5); // Returns 25 (cached)
```

### Promise Utilities

```typescript
import { sleep, retry, timeout, parallel } from '@vcomm/utils';

// Sleep
await sleep(1000); // Wait 1 second

// Retry with backoff
const result = await retry(
  () => fetch('https://api.example.com'),
  { maxAttempts: 3, delay: 1000 }
);

// Timeout
const data = await timeout(
  fetch('https://api.example.com'),
  5000,
  'Request timed out'
);

// Parallel with concurrency
const results = await parallel(
  [
    () => fetch('/api/1'),
    () => fetch('/api/2'),
    () => fetch('/api/3'),
  ],
  2 // Max 2 concurrent requests
);
```

### Date/Time Utilities

```typescript
import { unixTimestamp, relativeTime, isToday } from '@vcomm/utils';

unixTimestamp(); // 1709827200
relativeTime(Date.now() - 3600000); // '1 hour ago'
isToday(new Date()); // true
```

### Validation Utilities

```typescript
import { isValidEmail, isValidUrl, isValidUuid } from '@vcomm/utils';

isValidEmail('user@example.com'); // true
isValidUrl('https://example.com'); // true
isValidUuid('550e8400-e29b-41d4-a716-446655440000'); // true
```

## API Reference

### String Utilities
- `randomString(length, charset?)` - Generate random string
- `randomAlphanumeric(length)` - Random alphanumeric string
- `randomNumeric(length)` - Random numeric string
- `randomHex(length)` - Random hex string
- `uuid()` - Generate UUID v4
- `snowflake(timestamp?, sequence?)` - Generate snowflake ID
- `capitalize(str)` - Capitalize first letter
- `titleCase(str)` - Convert to title case
- `camelCase(str)` - Convert to camelCase
- `snakeCase(str)` - Convert to snake_case
- `kebabCase(str)` - Convert to kebab-case
- `truncate(str, length, ellipsis?)` - Truncate with ellipsis
- `escapeHtml(str)` - Escape HTML entities
- `escapeRegex(str)` - Escape regex special chars

### Number Utilities
- `clamp(value, min, max)` - Clamp value to range
- `inRange(value, min, max)` - Check if in range
- `randomInt(min, max)` - Random integer
- `randomFloat(min, max)` - Random float
- `roundTo(value, decimals)` - Round to decimals
- `lerp(start, end, t)` - Linear interpolation
- `mapRange(value, inMin, inMax, outMin, outMax)` - Map between ranges
- `formatBytes(bytes, decimals?)` - Format bytes
- `formatDuration(ms)` - Format duration

### Array Utilities
- `shuffle(array)` - Shuffle in place
- `shuffled(array)` - Return shuffled copy
- `unique(array)` - Get unique values
- `uniqueBy(array, keyFn)` - Unique by key
- `groupBy(array, keyFn)` - Group by key
- `chunk(array, size)` - Split into chunks
- `flatten(array)` - Flatten one level
- `first(array)`, `last(array)` - Get first/last
- `take(array, n)`, `drop(array, n)` - Take/drop n elements
- `partition(array, predicate)` - Split by predicate
- `difference(a, b)`, `intersection(a, b)`, `union(a, b)` - Set operations
- `zip(a, b)`, `unzip(array)` - Zip/unzip arrays
- `range(start, end?, step?)` - Create range

### Object Utilities
- `deepClone(obj)` - Deep clone
- `deepMerge(target, ...sources)` - Deep merge
- `pick(obj, ...keys)` - Pick properties
- `omit(obj, ...keys)` - Omit properties
- `mapValues(obj, fn)` - Map values
- `mapKeys(obj, fn)` - Map keys
- `invert(obj)` - Swap keys and values
- `isEmpty(obj)` - Check if empty

### Function Utilities
- `debounce(fn, wait)` - Debounce function
- `throttle(fn, limit)` - Throttle function
- `memoize(fn, resolver?)` - Memoize function
- `once(fn)` - Run only once
- `curry(fn, arity?)` - Curry function
- `compose(...fns)` - Compose functions (right to left)
- `pipe(...fns)` - Pipe functions (left to right)
- `noop()` - No-operation function
- `identity(x)` - Identity function

### Promise Utilities
- `sleep(ms)` - Sleep for milliseconds
- `retry(fn, options?)` - Retry with backoff
- `timeout(promise, ms, message?)` - Timeout wrapper
- `parallel(tasks, concurrency?)` - Parallel execution
- `props(obj)` - Promise.all for objects

### Date/Time Utilities
- `toISOString(date)` - Format to ISO string
- `fromISOString(str)` - Parse ISO string
- `unixTimestamp(date?)` - Get Unix timestamp (seconds)
- `unixTimestampMs(date?)` - Get Unix timestamp (milliseconds)
- `isToday(date)` - Check if today
- `relativeTime(date)` - Get relative time string

### Validation Utilities
- `isValidEmail(email)` - Validate email
- `isValidUrl(url)` - Validate URL
- `isValidUuid(uuid)` - Validate UUID
- `isValidPhone(phone)` - Validate phone (E.164)
- `isValidHexColor(color)` - Validate hex color
- `isValidIPv4(ip)` - Validate IPv4
- `isValidIPv6(ip)` - Validate IPv6

## License

MIT