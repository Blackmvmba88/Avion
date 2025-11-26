# Tests

Test suite for Avion flight simulator.

## Structure

- `physics/` - Physics system tests
- `rendering/` - Rendering tests
- `performance/` - Performance benchmarks
- `engine/` - Core engine tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- physics

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Writing Tests

See `/docs/tech/testing.md` for testing guidelines and examples.

## TODO

- Add unit tests for all modules
- Implement integration tests
- Create performance benchmarks
- Set up CI/CD testing
