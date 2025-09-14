#!/bin/bash

# VPkg Local Testing Script
# This script helps community developers test their vpkg packages locally with vandor-cli

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VANDOR_CLI_PATH="../../vandor-cli"
TEST_PROJECT_DIR="./test-project"
PACKAGE_NAME=""
LOCAL_REGISTRY_PORT=8080

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
VPkg Local Testing Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    setup           Setup local testing environment
    test <package>  Test a specific package (e.g., your-org/your-package)
    serve           Start local registry server for testing
    clean           Clean up test environment
    validate        Validate package structure and templates

Options:
    -h, --help      Show this help message
    -p, --port      Port for local registry server (default: 8080)
    -c, --cli       Path to vandor-cli (default: ../../vandor-cli)

Examples:
    $0 setup                    # Setup testing environment
    $0 test your-org/redis-cache # Test your redis-cache package
    $0 serve                    # Start local registry server
    $0 validate                 # Validate all packages in this repo
    $0 clean                    # Clean up test files

EOF
}

# Check if vandor CLI exists and is built
check_vandor_cli() {
    if [[ ! -d "$VANDOR_CLI_PATH" ]]; then
        print_error "Vandor CLI not found at $VANDOR_CLI_PATH"
        print_status "Please set the correct path with -c flag or build vandor-cli first"
        exit 1
    fi

    if [[ ! -f "$VANDOR_CLI_PATH/vandor" ]]; then
        print_status "Building vandor CLI..."
        (cd "$VANDOR_CLI_PATH" && go build -o vandor main.go)
        if [[ $? -eq 0 ]]; then
            print_success "Vandor CLI built successfully"
        else
            print_error "Failed to build vandor CLI"
            exit 1
        fi
    fi
}

# Setup test environment
setup_test_environment() {
    print_status "Setting up local testing environment..."

    # Create test project directory
    mkdir -p "$TEST_PROJECT_DIR"
    cd "$TEST_PROJECT_DIR"

    # Initialize a basic Go project for testing
    if [[ ! -f go.mod ]]; then
        print_status "Initializing test Go project..."
        go mod init github.com/test-org/vpkg-test-project

        # Create basic project structure
        mkdir -p cmd/app internal/core/domain internal/infrastructure internal/delivery/http

        # Create basic main.go
        cat > cmd/app/main.go << 'EOF'
package main

import (
    "fmt"
    "log"
    "go.uber.org/fx"
)

func main() {
    app := fx.New(
        fx.Invoke(func() {
            fmt.Println("VPkg Test Project Started")
        }),
    )

    if err := app.Err(); err != nil {
        log.Fatal(err)
    }
}
EOF

        # Add basic dependencies
        go mod tidy
        go get go.uber.org/fx
    fi

    # Initialize vandor config
    if [[ ! -f vandor-config.yaml ]]; then
        print_status "Initializing vandor config..."
        cat > vandor-config.yaml << EOF
project:
  name: vpkg-test-project
  module: github.com/test-org/vpkg-test-project
  version: "0.1.0"

vandor:
  cli: "0.5.0"
  architecture: "full-backend"
  language: go

vpkg: []
EOF
    fi

    cd ..
    print_success "Test environment setup complete"
}

# Start local registry server
start_local_registry() {
    print_status "Starting local registry server on port $LOCAL_REGISTRY_PORT..."

    # Create temporary registry.yaml pointing to current directory
    cat > .temp-registry.yaml << EOF
version: "3.0"
registry_url: "http://localhost:$LOCAL_REGISTRY_PORT"
repositories:
  - name: "local-test-repo"
    repository: "http://localhost:$LOCAL_REGISTRY_PORT"
    meta_url: "http://localhost:$LOCAL_REGISTRY_PORT/meta.yaml"
    author: "Local Test"
    verified: false
tags:
  - name: "test"
    description: "Local testing tag"
EOF

    # Start simple HTTP server
    print_status "Starting HTTP server to serve local packages..."
    print_warning "Use Ctrl+C to stop the server"
    python3 -m http.server $LOCAL_REGISTRY_PORT 2>/dev/null || python -m SimpleHTTPServer $LOCAL_REGISTRY_PORT
}

# Test a specific package
test_package() {
    local package_name="$1"

    if [[ -z "$package_name" ]]; then
        print_error "Package name is required"
        print_status "Usage: $0 test <package-name>"
        print_status "Example: $0 test your-org/redis-cache"
        exit 1
    fi

    print_status "Testing package: $package_name"

    # Check if package exists in meta.yaml
    if ! grep -q "name: \"$package_name\"" meta.yaml; then
        print_error "Package '$package_name' not found in meta.yaml"
        print_status "Available packages:"
        grep "name: \"" meta.yaml | sed 's/.*name: "\(.*\)".*/  - \1/'
        exit 1
    fi

    # Setup test environment if needed
    if [[ ! -d "$TEST_PROJECT_DIR" ]]; then
        setup_test_environment
    fi

    cd "$TEST_PROJECT_DIR"

    # Test package installation with dry-run first
    print_status "Testing package installation (dry-run)..."
    if "$VANDOR_CLI_PATH/vandor" vpkg add "$package_name" --dry-run --registry="http://localhost:$LOCAL_REGISTRY_PORT/.temp-registry.yaml"; then
        print_success "Dry-run test passed"
    else
        print_error "Dry-run test failed"
        cd ..
        exit 1
    fi

    # Actual installation test
    print_status "Testing actual package installation..."
    if "$VANDOR_CLI_PATH/vandor" vpkg add "$package_name" --force --registry="http://localhost:$LOCAL_REGISTRY_PORT/.temp-registry.yaml"; then
        print_success "Package installation test passed"
    else
        print_error "Package installation test failed"
        cd ..
        exit 1
    fi

    # Check if files were created
    local package_path=$(echo "$package_name" | sed 's/\//-/g')
    local install_path="internal/vpkg/${package_name}"

    if [[ -d "$install_path" ]]; then
        print_success "Package files created at: $install_path"
        print_status "Generated files:"
        find "$install_path" -type f | sed 's/^/  - /'

        # Check if Go files compile
        print_status "Testing Go compilation..."
        if go build ./...; then
            print_success "All Go files compile successfully"
        else
            print_warning "Some Go files have compilation issues"
        fi

    else
        print_error "Package files not created at expected path: $install_path"
    fi

    cd ..
}

# Validate package structure
validate_packages() {
    print_status "Validating package structure and templates..."

    local errors=0

    # Check if meta.yaml exists and is valid
    if [[ ! -f meta.yaml ]]; then
        print_error "meta.yaml not found"
        ((errors++))
    else
        print_status "Checking meta.yaml structure..."

        # Basic YAML validation
        if command -v yq >/dev/null 2>&1; then
            if yq eval '.packages | length' meta.yaml >/dev/null 2>&1; then
                print_success "meta.yaml is valid YAML"
            else
                print_error "meta.yaml has invalid YAML syntax"
                ((errors++))
            fi
        else
            print_warning "yq not found, skipping detailed YAML validation"
        fi
    fi

    # Check template files
    print_status "Checking template files..."

    while IFS= read -r templates_dir; do
        if [[ -n "$templates_dir" && "$templates_dir" != "null" ]]; then
            if [[ -d "$templates_dir" ]]; then
                local tmpl_count=$(find "$templates_dir" -name "*.tmpl" | wc -l)
                if [[ $tmpl_count -gt 0 ]]; then
                    print_success "Found $tmpl_count template files in $templates_dir"
                else
                    print_error "No template files found in $templates_dir"
                    ((errors++))
                fi
            else
                print_error "Templates directory not found: $templates_dir"
                ((errors++))
            fi
        fi
    done < <(grep "templates:" meta.yaml | sed 's/.*templates: "\(.*\)"/\1/' | sed 's/.*templates: \(.*\)/\1/')

    # Check for common template patterns
    find packages -name "*.tmpl" -type f | while read -r tmpl_file; do
        print_status "Validating template: $tmpl_file"

        # Check for template syntax
        if grep -q "{{.*}}" "$tmpl_file"; then
            print_success "Template syntax found in $tmpl_file"
        else
            print_warning "No template syntax found in $tmpl_file (might be a static file)"
        fi

        # Check for Go syntax in Go templates
        if [[ "$tmpl_file" == *.go.tmpl ]]; then
            # Basic Go syntax check (package declaration)
            if grep -q "^package " "$tmpl_file"; then
                print_success "Go package declaration found in $tmpl_file"
            else
                print_error "No Go package declaration in $tmpl_file"
                ((errors++))
            fi
        fi
    done

    if [[ $errors -eq 0 ]]; then
        print_success "All validation checks passed!"
    else
        print_error "Found $errors validation errors"
        exit 1
    fi
}

# Clean up test environment
clean_test_environment() {
    print_status "Cleaning up test environment..."

    rm -rf "$TEST_PROJECT_DIR"
    rm -f .temp-registry.yaml

    print_success "Test environment cleaned up"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--port)
            LOCAL_REGISTRY_PORT="$2"
            shift 2
            ;;
        -c|--cli)
            VANDOR_CLI_PATH="$2"
            shift 2
            ;;
        setup)
            check_vandor_cli
            setup_test_environment
            exit 0
            ;;
        test)
            check_vandor_cli
            test_package "$2"
            exit 0
            ;;
        serve)
            start_local_registry
            exit 0
            ;;
        validate)
            validate_packages
            exit 0
            ;;
        clean)
            clean_test_environment
            exit 0
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
done

# If no command provided, show help
show_help