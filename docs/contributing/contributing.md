# Contributing to Avion

Thank you for your interest in contributing to Avion! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Pull Request Process](#pull-request-process)
5. [Issue Guidelines](#issue-guidelines)
6. [Testing](#testing)
7. [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or inflammatory remarks
- Personal or political attacks
- Publishing private information without permission
- Any conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Basic knowledge of JavaScript and Three.js

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Avion.git
   cd Avion
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Blackmvmba88/Avion.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Visit** `http://localhost:5173`

### Project Structure

```
Avion/
├── src/              # Source code
│   ├── engine/       # Core engine code
│   ├── game/         # Game logic
│   ├── config/       # Configuration files
│   └── assets/       # Game assets
├── docs/             # Documentation
├── tests/            # Test files
└── tools/            # Build and development tools
```

## Development Process

### Branching Strategy

- `main` - Stable release branch
- `develop` - Active development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Workflow

1. **Sync with upstream**
   ```bash
   git checkout develop
   git fetch upstream
   git merge upstream/develop
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Write code following [Code Style](./code-style.md)
   - Add tests for new functionality
   - Update documentation

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a PR to `develop`
   - Fill out the PR template
   - Wait for review

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(physics): add ground effect modeling

Implemented ground effect that increases lift and reduces drag
when flying close to the ground.

Closes #123
```

```
fix(rendering): correct shadow flickering on terrain

Fixed z-fighting issue with shadow maps by adjusting near/far
planes and increasing shadow map resolution.
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with develop

### PR Template

When creating a PR, include:

1. **Description**: Clear explanation of changes
2. **Motivation**: Why is this change needed?
3. **Testing**: How was it tested?
4. **Screenshots**: For visual changes
5. **Breaking Changes**: List any breaking changes
6. **Related Issues**: Link to relevant issues

### Review Process

1. **Automated Checks**: CI/CD pipeline runs
2. **Code Review**: Maintainer reviews code
3. **Feedback**: Address any comments
4. **Approval**: Maintainer approves PR
5. **Merge**: PR is merged to develop

### Review Criteria

Reviewers check for:
- Code quality and style
- Test coverage
- Documentation
- Performance impact
- Security concerns
- Backward compatibility

## Issue Guidelines

### Before Creating an Issue

1. Search existing issues
2. Check if it's already in the roadmap
3. Verify it's reproducible
4. Collect relevant information

### Issue Types

#### Bug Report

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Screenshots**
If applicable

**Additional Context**
Any other relevant information
```

#### Feature Request

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought of

**Additional Context**
Any other relevant information
```

#### Question

```markdown
**Question**
Clear and concise question

**Context**
What are you trying to achieve?

**What You've Tried**
Steps you've already taken
```

## Testing

### Running Tests

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

### Writing Tests

We use [Vitest](https://vitest.dev/) for testing.

**Example Unit Test**:
```javascript
import { describe, it, expect } from 'vitest';
import { FlightPhysics } from '../src/engine/physics/FlightPhysics.js';

describe('FlightPhysics', () => {
    it('calculates lift correctly', () => {
        const physics = new FlightPhysics();
        const lift = physics.calculateLift({
            airDensity: 1.225,
            airspeed: 50,
            wingArea: 20,
            liftCoefficient: 1.0
        });
        
        expect(lift).toBeCloseTo(30625, 0);
    });
});
```

**Test Coverage Goals**:
- Core engine: 90%+
- Physics: 95%+
- Utilities: 80%+
- UI components: 70%+

## Documentation

### Code Documentation

Use JSDoc for all public APIs:

```javascript
/**
 * Calculates aerodynamic lift force
 * 
 * @param {Object} params - Lift calculation parameters
 * @param {number} params.airDensity - Air density in kg/m³
 * @param {number} params.airspeed - Airspeed in m/s
 * @param {number} params.wingArea - Wing area in m²
 * @param {number} params.liftCoefficient - Coefficient of lift
 * @returns {number} Lift force in Newtons
 * 
 * @example
 * const lift = calculateLift({
 *     airDensity: 1.225,
 *     airspeed: 50,
 *     wingArea: 20,
 *     liftCoefficient: 1.0
 * });
 */
function calculateLift(params) {
    return 0.5 * params.airDensity * Math.pow(params.airspeed, 2) 
           * params.wingArea * params.liftCoefficient;
}
```

### Documentation Updates

When changing functionality:
- Update relevant markdown files in `docs/`
- Update README if public API changes
- Add examples for new features
- Update inline code comments

## Areas of Contribution

### High Priority

- **Physics Improvements**: Ground effect, wind, turbulence
- **Aircraft Models**: New aircraft types
- **Missions**: New mission scenarios
- **Mobile Optimization**: Performance and controls
- **Testing**: Increase test coverage

### Medium Priority

- **Visual Effects**: Particles, lighting, shaders
- **Audio**: Engine sounds, environmental audio
- **Documentation**: Tutorials, guides, API docs
- **UI/UX**: Menu improvements, HUD enhancements

### Low Priority (but appreciated!)

- **Internationalization**: Translation support
- **Accessibility**: Screen reader support, colorblind modes
- **Performance**: Optimization and profiling
- **Tools**: Development and build tools

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Project website
- Annual contributor highlights

Top contributors may be invited to become maintainers.

## Getting Help

### Resources

- **Documentation**: `docs/` directory
- **Discord**: [Join our server](https://discord.gg/avion)
- **Discussions**: GitHub Discussions
- **Issues**: GitHub Issues for bugs

### Questions

Before asking, check:
1. Documentation
2. Existing issues
3. Discord search

If still unclear, ask in:
- Discord `#help` channel
- GitHub Discussions

## License

By contributing to Avion, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Avion! Your efforts help make flight simulation accessible to everyone.** ✈️
