# VPkg Template

This directory contains the template structure for creating new VPkg packages. Use this template when contributing new packages to the VPkg registry.

## 🚀 Quick Start

1. **Fork this template repository**
2. **Use the testing tools** to validate and test your package locally
3. **Submit a Pull Request** with your package addition

## 🛠️ Testing Your Package

We provide comprehensive testing tools to ensure your package works perfectly with vandor-cli:

### Local Testing

```bash
# Make scripts executable (first time only)
chmod +x test-locally.sh validate-package.js

# Setup test environment
./test-locally.sh setup

# Validate package structure
npm install  # Install js-yaml dependency
npm run validate  # or node validate-package.js

# Test specific package
./test-locally.sh test your-org/your-package

# Start local registry server for testing
./test-locally.sh serve

# Clean up test environment
./test-locally.sh clean
```

### Automated Testing

The repository includes GitHub Actions that automatically:
- ✅ Validate package structure and metadata
- ✅ Test package installation with vandor-cli
- ✅ Verify template rendering produces valid Go code
- ✅ Run security scans
- ✅ Generate comprehensive test reports

## 📋 How to Use This Template

### 1. Create Your Package Repository

```bash
# Option 1: Use GitHub template (recommended)
# Click "Use this template" on GitHub

# Option 2: Clone and customize
git clone https://github.com/your-org/vpkg-template.git your-vpkg-repo
cd your-vpkg-repo
```

### 2. Customize Package Metadata

Edit `meta.yaml` with your package information:

```yaml
version: "3.0"
repository: "https://github.com/your-org/your-vpkg-repo"
author: "Your Name"
license: "MIT"

packages:
  - name: "your-org/awesome-package"
    title: "Awesome Package"
    description: "Does something amazing"
    type: "fx-module"  # or cli-command, utility, etc.
    templates: "packages/awesome-package/templates"
    destination: "internal/vpkg/your-org/awesome-package"
    version: "v1.0.0"
    tags: ["full-backend", "cache", "redis"]
    dependencies:
      - "github.com/redis/go-redis/v9"
```

### 3. Create Template Files

```bash
# Create package directory structure
mkdir -p packages/awesome-package/templates

# Create Go template
cat > packages/awesome-package/templates/awesome.go.tmpl << 'EOF'
package {{.Package}}

import (
    "go.uber.org/fx"
)

// Module provides {{.Title}} functionality
var Module = fx.Module("{{.Package}}",
    fx.Provide(New{{.Title}}),
)

// New{{.Title}} creates a new {{.Title}} instance
func New{{.Title}}() *{{.Title}} {
    return &{{.Title}}{}
}

// {{.Title}} provides awesome functionality
type {{.Title}} struct {
    // Add your fields here
}
EOF

# Create README template
cat > packages/awesome-package/templates/README.md.tmpl << 'EOF'
# {{.Title}}

{{.Description}}

## Installation

```bash
vandor vpkg add {{.VpkgName}}
```

## Usage

```go
import "{{.Module}}/{{.PackagePath}}"

app := fx.New(
    {{.Package}}.Module,
    // ... other modules
)
```
EOF
```

### 4. Test Your Package

```bash
# Validate package structure
./validate-package.js

# Test installation locally
./test-locally.sh setup
./test-locally.sh test your-org/awesome-package

# Test with different Go versions
./test-locally.sh test your-org/awesome-package --go-version 1.21
```

### 5. Submit for Review

```bash
git add .
git commit -m "Add awesome-package vpkg"
git push origin main

# Create Pull Request to vpkg-registry
```

## File Structure

```
your-org-your-package/
├── meta.yaml              # Package metadata and configuration
├── templates/             # Template files for code generation
│   ├── main.go.tmpl      # Main Go code template
│   ├── README.md.tmpl    # Package documentation template
│   └── ...               # Additional template files
└── README.md             # Package description and usage
```

## 📝 Template Variables

The following variables are available in your template files:

### Core Variables
- `{{.Title}}` - Package title (e.g., "Redis Cache")
- `{{.Package}}` - Sanitized package name for Go identifiers (e.g., "rediscache")
- `{{.VpkgName}}` - Full vpkg name (e.g., "vandor/redis-cache")
- `{{.Namespace}}` - Organization/namespace (e.g., "vandor")
- `{{.Pkg}}` - Raw package name (e.g., "redis-cache")
- `{{.Description}}` - Package description

### Project Context
- `{{.Module}}` - Target project's Go module name (e.g., "github.com/user/project")
- `{{.PackagePath}}` - Installation path (e.g., "internal/vpkg/vandor/redis-cache")
- `{{.Version}}` - Package version (e.g., "v1.0.0")
- `{{.Author}}` - Package author name
- `{{.Time}}` - Installation timestamp (RFC3339)

### Template Helpers
- `{{.Title}}` → "Redis Cache"
- `{{Title .Pkg}}` → "Redis Cache" (from "redis-cache")
- `{{Camel .Pkg}}` → "redisCache"
- `{{Pascal .Pkg}}` → "RedisCache"
- `{{Snake .Pkg}}` → "redis_cache"

## Package Types

- `fx-module` - Uber FX module with lifecycle management
- `cli-command` - Command-line tool or subcommand
- `utility` - Utility functions or helpers
- `middleware` - HTTP middleware or interceptors
- `service` - Standalone service components

## Tags

Use relevant tags to categorize your package:

- **Architecture compatibility**: `full-backend`, `eda`, `minimal`
- **Functionality**: `cache`, `database`, `logging`, `auth`, `http`, `grpc`, `messaging`
- **Domain**: `payment`, `notification`, `storage`, `monitoring`

## 🎯 Best Practices

### 1. Package Design
- **Single Responsibility**: Each package should have one clear purpose
- **Fx Integration**: For fx-modules, export a `Module` variable and provide constructor functions
- **Configuration**: Use struct-based configuration with sensible defaults
- **Error Handling**: Implement proper error handling and context propagation

### 2. Template Guidelines
- **Go Conventions**: Follow standard Go naming, structure, and idioms
- **Documentation**: Include comprehensive godoc comments
- **Dependencies**: Only include necessary dependencies in meta.yaml
- **Testing**: Provide example usage and test patterns where applicable

### 3. File Organization
```
packages/your-package/
├── templates/
│   ├── package.go.tmpl     # Main implementation
│   ├── config.go.tmpl      # Configuration (if needed)
│   ├── README.md.tmpl      # Package documentation
│   └── example.go.tmpl     # Usage example (optional)
```

### 4. Security Considerations
- **No Hardcoded Secrets**: Use environment variables or configuration
- **Input Validation**: Validate all external inputs
- **Resource Management**: Implement proper cleanup and resource management
- **Dependencies**: Only use trusted, well-maintained dependencies

## 🔧 Testing Tools Reference

### Local Testing Script (`./test-locally.sh`)
```bash
# Available commands:
./test-locally.sh setup           # Setup test environment
./test-locally.sh test <package>  # Test specific package
./test-locally.sh serve          # Start local registry server
./test-locally.sh validate      # Validate package structure
./test-locally.sh clean         # Clean up test environment

# Options:
-p, --port     # Set registry server port (default: 8080)
-c, --cli      # Set vandor-cli path (default: ../../vandor-cli)
```

### Package Validator (`./validate-package.js`)
```bash
node validate-package.js         # Validate package structure
npm run validate                # Same as above (via package.json)

# Checks performed:
- meta.yaml structure and syntax
- Package definition completeness
- Template file existence and basic syntax
- Go template compilation
- Security pattern scanning
```

### GitHub Actions
The included workflow (`.github/workflows/test-vpkg.yml`) automatically:
- Validates package structure on push/PR
- Tests installation with multiple Go versions
- Checks template rendering produces valid code
- Runs security scans
- Generates comprehensive test reports
- Comments results on PRs

## 📚 Examples

### FX-Module Package Example
```go
// templates/cache.go.tmpl
package {{.Package}}

import (
    "context"
    "time"
    "go.uber.org/fx"
    "github.com/redis/go-redis/v9"
)

// Module provides {{.Title}} functionality
var Module = fx.Module("{{.Package}}",
    fx.Provide(New{{.Title}}),
)

// Config holds {{.Title}} configuration
type Config struct {
    Addr     string        `yaml:"addr" default:"localhost:6379"`
    Password string        `yaml:"password"`
    DB       int           `yaml:"db" default:"0"`
    Timeout  time.Duration `yaml:"timeout" default:"5s"`
}

// {{.Title}} provides caching functionality
type {{.Title}} struct {
    client *redis.Client
}

// New{{.Title}} creates a new {{.Title}} instance
func New{{.Title}}(config Config) *{{.Title}} {
    client := redis.NewClient(&redis.Options{
        Addr:     config.Addr,
        Password: config.Password,
        DB:       config.DB,
    })

    return &{{.Title}}{
        client: client,
    }
}

// Get retrieves a value from cache
func (c *{{.Title}}) Get(ctx context.Context, key string) (string, error) {
    return c.client.Get(ctx, key).Result()
}

// Set stores a value in cache
func (c *{{.Title}}) Set(ctx context.Context, key, value string, ttl time.Duration) error {
    return c.client.Set(ctx, key, value, ttl).Err()
}
```

### CLI-Command Package Example
```go
// templates/cmd/main.go.tmpl
package main

import (
    "fmt"
    "os"
    "github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
    Use:   "{{.Pkg}}",
    Short: "{{.Description}}",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Println("{{.Title}} CLI tool")
        fmt.Printf("Package: {{.VpkgName}}\n")
        fmt.Printf("Version: {{.Version}}\n")
    },
}

func main() {
    if err := rootCmd.Execute(); err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
}
```

## 🤝 Contributing to VPkg Registry

1. **Fork** the vpkg-registry repository
2. **Create** your package using this template
3. **Test** thoroughly using the provided testing tools
4. **Submit** a Pull Request with:
   - Clear description of package functionality
   - Usage examples
   - Test results from automated testing
5. **Respond** to review feedback and iterate

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/alfariiizi/vpkg-template/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alfariiizi/vpkg-template/discussions)
- **Documentation**: [Vandor Documentation](https://docs.vandor.dev)