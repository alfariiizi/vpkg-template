# VPkg Template

This directory contains the template structure for creating new VPkg packages. Use this template when contributing new packages to the VPkg registry.

## How to Use This Template

1. **Fork the vpkg-registry repository**
2. **Copy this template directory** to create your package structure
3. **Modify the files** according to your package needs:
   - Update `meta.yaml` with your package information
   - Modify template files in the `templates/` directory
   - Update this README with package-specific information

4. **Submit a Pull Request** with your package addition

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

## Template Variables

The following variables are available in your template files:

- `{{.PackageName}}` - The package name (e.g., "redis-cache")
- `{{.Title}}` - The package title (e.g., "Redis Cache")
- `{{.Description}}` - Package description
- `{{.Name}}` - Full package name (e.g., "vandor/redis-cache")
- `{{.Organization}}` - Organization name (e.g., "vandor")
- `{{.ModuleName}}` - Go module name from the target project
- `{{.Dependencies}}` - List of Go module dependencies
- `{{.License}}` - Package license
- `{{.Author}}` - Package author

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

## Guidelines

1. **Follow Go conventions** - Use proper Go naming, structure, and idioms
2. **Include comprehensive documentation** - Both in code comments and README
3. **Add configuration examples** - Show how to configure and use the package
4. **Include error handling** - Proper error handling and logging
5. **Support graceful shutdown** - If applicable, implement proper cleanup
6. **Add tests** - Include test templates if your package needs specific testing patterns

## Example Package Structure

See existing packages in the `vpkg-vandor-official/` directory for examples of well-structured packages.