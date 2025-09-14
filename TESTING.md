# VPkg Testing Guide

This guide explains how to test your vpkg packages thoroughly before submitting them to the registry.

## 🚀 Quick Testing Workflow

```bash
# 1. Make scripts executable (first time only)
chmod +x test-locally.sh validate-package.js

# 2. Install Node.js dependencies for validation
npm install

# 3. Validate package structure
npm run validate

# 4. Setup local testing environment
./test-locally.sh setup

# 5. Test your packages
./test-locally.sh test your-org/package-name

# 6. Clean up when done
./test-locally.sh clean
```

## 📋 Test Categories

### 1. Structure Validation
**Purpose**: Ensure package metadata and file structure are correct

```bash
# Validate meta.yaml structure
node validate-package.js

# Check for common issues
npm run validate
```

**What it checks:**
- ✅ meta.yaml syntax and required fields
- ✅ Package name format (`org/package-name`)
- ✅ Template file existence
- ✅ Version format compliance
- ✅ Go template syntax validation
- ✅ Security pattern scanning

### 2. Installation Testing
**Purpose**: Test actual package installation with vandor-cli

```bash
# Setup test project
./test-locally.sh setup

# Test specific package
./test-locally.sh test your-org/package-name

# Test with dry-run first
./test-locally.sh test your-org/package-name --dry-run
```

**What it tests:**
- ✅ Package discovery in registry
- ✅ Template file downloading
- ✅ Template rendering with variables
- ✅ File placement in correct directories
- ✅ Go compilation of generated code

### 3. Template Rendering
**Purpose**: Verify templates generate valid, compilable code

```bash
# Setup local registry server
./test-locally.sh serve &

# Test template rendering
./test-locally.sh test your-org/package-name

# Check generated files
cd test-project/internal/vpkg/your-org/package-name
cat *.go  # Inspect generated Go code
```

**What it verifies:**
- ✅ Template variables are properly substituted
- ✅ Generated Go code compiles without errors
- ✅ Package structure follows Go conventions
- ✅ Import statements are correct

## 🔧 Testing Tools Reference

### Local Testing Script (`test-locally.sh`)

#### Commands
```bash
# Environment setup
./test-locally.sh setup              # Create test project
./test-locally.sh clean              # Remove test files

# Package testing
./test-locally.sh test <package>     # Test package installation
./test-locally.sh serve              # Start local registry server
./test-locally.sh validate          # Run all validations

# Options
-p, --port <port>    # Registry server port (default: 8080)
-c, --cli <path>     # Path to vandor-cli (default: ../../vandor-cli)
-h, --help           # Show help message
```

#### Example Usage
```bash
# Test with custom CLI path
./test-locally.sh test your-org/redis-cache -c /path/to/vandor-cli

# Use custom registry port
./test-locally.sh serve -p 9000
```

### Package Validator (`validate-package.js`)

#### Validation Checks
```bash
# Run all validations
node validate-package.js

# Expected output:
# [INFO] Validating meta.yaml...
# [INFO] Validating package 1: your-org/package-name
# [INFO] Validating template files...
# [SUCCESS] ✅ Package validation PASSED!
```

#### What Gets Validated

1. **Meta.yaml Structure**
   - Required fields: `version`, `repository`, `author`, `license`, `packages`
   - Package arrays with proper structure
   - Valid package names (`org/package-name` format)
   - Version format compliance

2. **Package Definitions**
   - Required package fields: `name`, `title`, `description`, `type`, `templates`, `version`
   - Valid package types: `fx-module`, `cli-command`, `utility`, `middleware`, `service`
   - Template directory existence
   - Dependencies array format

3. **Template Files**
   - Template file discovery in specified directories
   - Go template syntax validation
   - Package declaration in Go templates
   - Fx module structure (for fx-module packages)
   - Function documentation compliance

4. **Security Scanning**
   - No hardcoded secrets (password, token, key)
   - No dangerous exec calls
   - No unsafe operations

### GitHub Actions Testing

The repository includes automated testing via GitHub Actions:

#### Workflow Triggers
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

#### Test Matrix
- **Go Versions**: 1.21, 1.22
- **Platforms**: Ubuntu Latest
- **Node.js**: Version 18

#### Test Stages

1. **Validate** - Structure and syntax validation
2. **Test Installation** - Package installation testing
3. **Template Rendering** - Code generation validation
4. **Security Scan** - Security pattern detection
5. **Report Generation** - Comprehensive test reports

#### Viewing Results
- Check GitHub Actions tab for workflow runs
- Download test reports from workflow artifacts
- PR comments include automated test summaries

## 🐛 Troubleshooting Common Issues

### Issue: "Package not found in meta.yaml"
```bash
# Check package name format
grep 'name: "' meta.yaml

# Ensure exact match with test command
./test-locally.sh test "exact-org/exact-name"
```

### Issue: "Templates directory not found"
```bash
# Check template paths in meta.yaml
grep 'templates:' meta.yaml

# Verify directories exist
ls -la packages/*/templates/
```

### Issue: "No template files found"
```bash
# Check for .tmpl files
find packages -name "*.tmpl"

# Verify naming convention
ls packages/your-package/templates/
# Should contain: *.go.tmpl, README.md.tmpl, etc.
```

### Issue: "Template rendering failed"
```bash
# Check template syntax manually
cat packages/your-package/templates/main.go.tmpl

# Look for valid template variables
# Good: {{.Title}}, {{.Package}}, {{.Module}}
# Bad: {{.InvalidVar}}
```

### Issue: "Go compilation failed"
```bash
# Test generated code directly
cd test-project
go build ./...

# Check for syntax errors in generated files
find internal/vpkg -name "*.go" -exec go fmt {} \;
```

### Issue: "Vandor CLI not found"
```bash
# Build vandor-cli if needed
cd ../../vandor-cli
go build -o vandor main.go

# Or specify custom path
./test-locally.sh test package-name -c /path/to/vandor-cli
```

## 📊 Testing Best Practices

### 1. Test Early and Often
```bash
# After each change to meta.yaml or templates
npm run validate
./test-locally.sh test your-org/package-name
```

### 2. Test Multiple Scenarios
```bash
# Test all packages in your repository
for package in $(grep 'name: "' meta.yaml | sed 's/.*name: "\(.*\)".*/\1/'); do
  ./test-locally.sh test "$package"
done
```

### 3. Validate in Clean Environment
```bash
# Start with clean slate
./test-locally.sh clean
./test-locally.sh setup
./test-locally.sh test your-org/package-name
```

### 4. Test Different Go Versions
```bash
# Test with different Go versions if available
go version  # Check current version

# Or use Docker for testing
docker run --rm -v $(pwd):/work -w /work golang:1.21 ./test-locally.sh test package-name
docker run --rm -v $(pwd):/work -w /work golang:1.22 ./test-locally.sh test package-name
```

### 5. Review Generated Code
```bash
# Always inspect generated files
cd test-project/internal/vpkg/your-org/package-name

# Check Go syntax
go fmt *.go
go vet *.go

# Check imports and dependencies
go mod tidy
```

## 🚨 Pre-submission Checklist

Before submitting your package to the registry:

- [ ] **Structure Validation**: `npm run validate` passes
- [ ] **Installation Test**: `./test-locally.sh test package-name` succeeds
- [ ] **Go Compilation**: Generated code compiles without errors
- [ ] **Template Variables**: All variables are properly substituted
- [ ] **Documentation**: README template is comprehensive
- [ ] **Dependencies**: Only necessary dependencies are listed
- [ ] **Security Scan**: No security issues detected
- [ ] **Multiple Packages**: All packages in repository are tested
- [ ] **Clean Install**: Test passes in fresh environment
- [ ] **CI/CD**: GitHub Actions tests pass

## 📈 Continuous Testing

### Local Development Loop
1. Edit package files
2. Run `npm run validate`
3. Test with `./test-locally.sh test package-name`
4. Inspect generated files
5. Iterate until perfect

### Pre-commit Hooks (Optional)
```bash
# Create .git/hooks/pre-commit
#!/bin/bash
npm run validate || exit 1
./test-locally.sh validate || exit 1
```

### Automated Testing
- GitHub Actions runs automatically on push/PR
- Test reports generated for each run
- PR comments provide immediate feedback

## 🎯 Performance Testing

### Large Package Testing
```bash
# Test packages with many files
time ./test-locally.sh test large-org/complex-package

# Monitor resource usage
top -p $(pgrep -f "test-locally")
```

### Concurrent Testing
```bash
# Test multiple packages in parallel
./test-locally.sh test org/package1 &
./test-locally.sh test org/package2 &
wait
```

Remember: **Testing is not optional** - it ensures your package works perfectly for all users and maintains the high quality standards of the VPkg ecosystem!