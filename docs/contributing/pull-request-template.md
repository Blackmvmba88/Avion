# Pull Request Template

## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the appropriate option with an 'x' -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Test updates
- [ ] Build/CI changes

## Related Issues

<!-- Link to related issues. Use "Fixes #123" to auto-close issues when merged -->

Fixes #
Related to #

## Motivation and Context

<!-- Why is this change required? What problem does it solve? -->

## Changes Made

<!-- List the specific changes you made -->

- 
- 
- 

## Testing

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

### Testing Steps

<!-- Describe the steps to test your changes -->

1. 
2. 
3. 

### Test Results

<!-- Describe what you tested and the results -->

**Environment**:
- OS: 
- Browser: 
- Node version: 

**Results**:
- [ ] Feature works as expected
- [ ] No regressions found
- [ ] Performance is acceptable

## Screenshots

<!-- Add screenshots for visual changes. Delete section if not applicable -->

### Before
<!-- Screenshot or description of behavior before changes -->

### After
<!-- Screenshot or description of behavior after changes -->

## Performance Impact

<!-- Describe any performance implications -->

- [ ] No significant performance impact
- [ ] Performance improved (describe how)
- [ ] Performance may be affected (justify why)

**Benchmarks** (if applicable):
```
Before: 
After: 
```

## Breaking Changes

<!-- List any breaking changes and migration steps -->

- [ ] No breaking changes
- [ ] Breaking changes (list below):

**Migration Guide**:
<!-- If breaking changes exist, provide migration instructions -->

## Checklist

### Code Quality

- [ ] My code follows the project's code style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have removed any console.log or debug statements
- [ ] No linter warnings or errors

### Documentation

- [ ] I have updated relevant documentation
- [ ] I have added JSDoc comments for new functions/classes
- [ ] I have updated the README (if needed)
- [ ] I have updated the CHANGELOG (if applicable)

### Testing

- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] I have tested on multiple browsers (if UI change)
- [ ] I have tested on mobile (if applicable)

### Dependencies

- [ ] I have not added new dependencies (or justified why needed)
- [ ] All dependencies are up to date
- [ ] No security vulnerabilities in dependencies

### Git

- [ ] My branch is up to date with the base branch
- [ ] I have rebased/merged latest changes
- [ ] Commits are atomic and well-described
- [ ] No merge conflicts

## Additional Notes

<!-- Any additional information for reviewers -->

## Reviewer Checklist

<!-- For maintainers reviewing the PR -->

- [ ] Code quality meets standards
- [ ] Tests are adequate
- [ ] Documentation is complete
- [ ] No security concerns
- [ ] Performance is acceptable
- [ ] Breaking changes are justified and documented

---

**For Reviewers**: 
- Please review the code and provide constructive feedback
- Check that tests pass and cover the changes
- Verify documentation is updated
- Test the changes locally if possible

**For Contributors**:
- Be responsive to feedback
- Make requested changes promptly
- Ask for clarification if feedback is unclear
- Be patient during the review process
