#!/usr/bin/env node

/**
 * VPkg Package Validator
 * Validates vpkg package structure, templates, and metadata
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class PackageValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        switch (level) {
            case 'error':
                this.errors.push(message);
                console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
                break;
            case 'warning':
                this.warnings.push(message);
                console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
                break;
            case 'info':
                this.info.push(message);
                console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
                break;
            case 'success':
                console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
                break;
        }
    }

    // Validate meta.yaml structure and content
    validateMetaYaml() {
        this.log('info', 'Validating meta.yaml...');

        if (!fs.existsSync('meta.yaml')) {
            this.log('error', 'meta.yaml file not found');
            return false;
        }

        try {
            const metaContent = fs.readFileSync('meta.yaml', 'utf8');
            const meta = yaml.load(metaContent);

            // Check required fields
            const requiredFields = ['version', 'repository', 'author', 'license', 'packages'];
            for (const field of requiredFields) {
                if (!meta[field]) {
                    this.log('error', `Missing required field in meta.yaml: ${field}`);
                }
            }

            // Validate version format
            if (meta.version && !meta.version.match(/^\d+\.\d+$/)) {
                this.log('warning', `Version format should be X.Y (e.g., "3.0"), found: ${meta.version}`);
            }

            // Validate packages array
            if (!Array.isArray(meta.packages)) {
                this.log('error', 'packages field must be an array');
                return false;
            }

            if (meta.packages.length === 0) {
                this.log('error', 'packages array cannot be empty');
                return false;
            }

            // Validate each package
            meta.packages.forEach((pkg, index) => {
                this.validatePackageDefinition(pkg, index);
            });

            this.log('success', 'meta.yaml structure is valid');
            return true;

        } catch (error) {
            this.log('error', `Failed to parse meta.yaml: ${error.message}`);
            return false;
        }
    }

    // Validate individual package definition
    validatePackageDefinition(pkg, index) {
        this.log('info', `Validating package ${index + 1}: ${pkg.name || 'unnamed'}`);

        const requiredPackageFields = ['name', 'title', 'description', 'type', 'templates', 'version'];
        for (const field of requiredPackageFields) {
            if (!pkg[field]) {
                this.log('error', `Package ${index + 1}: Missing required field: ${field}`);
            }
        }

        // Validate package name format
        if (pkg.name && !pkg.name.match(/^[a-z0-9\-]+\/[a-z0-9\-]+$/)) {
            this.log('error', `Package ${index + 1}: Invalid name format. Should be 'org/package-name', found: ${pkg.name}`);
        }

        // Validate package type
        const validTypes = ['fx-module', 'cli-command', 'utility', 'middleware', 'service'];
        if (pkg.type && !validTypes.includes(pkg.type)) {
            this.log('warning', `Package ${index + 1}: Unknown type '${pkg.type}'. Valid types: ${validTypes.join(', ')}`);
        }

        // Validate version format
        if (pkg.version && !pkg.version.match(/^v?\d+\.\d+\.\d+/)) {
            this.log('warning', `Package ${index + 1}: Version should follow semantic versioning (e.g., 'v1.0.0'), found: ${pkg.version}`);
        }

        // Validate templates directory
        if (pkg.templates && !fs.existsSync(pkg.templates)) {
            this.log('error', `Package ${index + 1}: Templates directory not found: ${pkg.templates}`);
        }

        // Validate tags
        if (pkg.tags && !Array.isArray(pkg.tags)) {
            this.log('error', `Package ${index + 1}: tags field must be an array`);
        }

        // Validate dependencies
        if (pkg.dependencies && !Array.isArray(pkg.dependencies)) {
            this.log('error', `Package ${index + 1}: dependencies field must be an array`);
        }
    }

    // Validate template files
    validateTemplates() {
        this.log('info', 'Validating template files...');

        if (!fs.existsSync('meta.yaml')) {
            this.log('error', 'meta.yaml not found, cannot validate templates');
            return false;
        }

        try {
            const metaContent = fs.readFileSync('meta.yaml', 'utf8');
            const meta = yaml.load(metaContent);

            let allValid = true;

            meta.packages.forEach((pkg, index) => {
                if (pkg.templates && fs.existsSync(pkg.templates)) {
                    const isValid = this.validatePackageTemplates(pkg, index);
                    if (!isValid) allValid = false;
                }
            });

            return allValid;

        } catch (error) {
            this.log('error', `Failed to validate templates: ${error.message}`);
            return false;
        }
    }

    // Validate templates for a specific package
    validatePackageTemplates(pkg, index) {
        this.log('info', `Validating templates for package: ${pkg.name}`);

        const templatesDir = pkg.templates;
        const templateFiles = this.findTemplateFiles(templatesDir);

        if (templateFiles.length === 0) {
            this.log('error', `Package ${index + 1}: No template files found in ${templatesDir}`);
            return false;
        }

        this.log('success', `Found ${templateFiles.length} template files for ${pkg.name}`);

        let allValid = true;

        templateFiles.forEach(filePath => {
            const isValid = this.validateTemplateFile(filePath, pkg);
            if (!isValid) allValid = false;
        });

        return allValid;
    }

    // Find all template files recursively
    findTemplateFiles(dir) {
        const files = [];

        if (!fs.existsSync(dir)) return files;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                files.push(...this.findTemplateFiles(itemPath));
            } else if (item.endsWith('.tmpl')) {
                files.push(itemPath);
            }
        }

        return files;
    }

    // Validate individual template file
    validateTemplateFile(filePath, pkg) {
        this.log('info', `Validating template: ${filePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check for template syntax
            const hasTemplateVars = content.includes('{{') && content.includes('}}');
            if (!hasTemplateVars) {
                this.log('warning', `${filePath}: No template variables found (might be a static file)`);
            }

            // Check for common template variables
            const commonVars = ['Title', 'Package', 'Module', 'Namespace', 'Description'];
            const usedVars = commonVars.filter(varName => content.includes(`{{.${varName}}}`));

            if (usedVars.length > 0) {
                this.log('success', `${filePath}: Uses template variables: ${usedVars.join(', ')}`);
            }

            // Validate Go files
            if (filePath.endsWith('.go.tmpl')) {
                return this.validateGoTemplate(filePath, content, pkg);
            }

            // Validate README files
            if (filePath.includes('README') || filePath.includes('readme')) {
                return this.validateReadmeTemplate(filePath, content, pkg);
            }

            return true;

        } catch (error) {
            this.log('error', `Failed to read template file ${filePath}: ${error.message}`);
            return false;
        }
    }

    // Validate Go template files
    validateGoTemplate(filePath, content, pkg) {
        // Check for package declaration
        if (!content.match(/^package\s+\w+/m)) {
            this.log('error', `${filePath}: Missing package declaration`);
            return false;
        }

        // Check for proper imports if fx-module
        if (pkg.type === 'fx-module') {
            if (!content.includes('go.uber.org/fx')) {
                this.log('warning', `${filePath}: fx-module should import go.uber.org/fx`);
            }

            // Check for Module export
            if (!content.includes('var Module') && !content.includes('func NewModule')) {
                this.log('warning', `${filePath}: fx-module should export Module or NewModule function`);
            }
        }

        // Check for proper function naming
        const functionMatches = content.match(/func\s+(\w+)/g);
        if (functionMatches) {
            functionMatches.forEach(match => {
                const funcName = match.replace('func ', '');
                if (funcName.charAt(0) === funcName.charAt(0).toUpperCase()) {
                    // Public function - should have comment
                    const funcRegex = new RegExp(`//.*\\n\\s*func\\s+${funcName}`, 'm');
                    if (!content.match(funcRegex)) {
                        this.log('warning', `${filePath}: Public function ${funcName} missing documentation comment`);
                    }
                }
            });
        }

        this.log('success', `${filePath}: Go template validation passed`);
        return true;
    }

    // Validate README template files
    validateReadmeTemplate(filePath, content, pkg) {
        // Check for basic sections
        const requiredSections = ['#', '##', '###']; // At least some heading
        const hasHeadings = requiredSections.some(heading => content.includes(heading));

        if (!hasHeadings) {
            this.log('warning', `${filePath}: No markdown headings found`);
        }

        // Check for installation instructions
        if (!content.toLowerCase().includes('install')) {
            this.log('warning', `${filePath}: No installation instructions found`);
        }

        // Check for usage examples
        if (!content.includes('```')) {
            this.log('warning', `${filePath}: No code examples found`);
        }

        this.log('success', `${filePath}: README template validation passed`);
        return true;
    }

    // Generate validation report
    generateReport() {
        console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
        console.log(colors.cyan + '           VPkg Package Validation Report' + colors.reset);
        console.log(colors.cyan + '='.repeat(60) + colors.reset);

        console.log(`\n${colors.green}✓ Checks passed: ${this.info.length}${colors.reset}`);
        console.log(`${colors.yellow}⚠ Warnings: ${this.warnings.length}${colors.reset}`);
        console.log(`${colors.red}✗ Errors: ${this.errors.length}${colors.reset}`);

        if (this.warnings.length > 0) {
            console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
            this.warnings.forEach((warning, i) => {
                console.log(`  ${i + 1}. ${warning}`);
            });
        }

        if (this.errors.length > 0) {
            console.log(`\n${colors.red}Errors:${colors.reset}`);
            this.errors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error}`);
            });
        }

        const isValid = this.errors.length === 0;

        if (isValid) {
            console.log(`\n${colors.green}🎉 Package validation PASSED!${colors.reset}`);
            console.log(`${colors.green}Your package is ready for testing and submission.${colors.reset}`);
        } else {
            console.log(`\n${colors.red}❌ Package validation FAILED!${colors.reset}`);
            console.log(`${colors.red}Please fix the errors above before submitting.${colors.reset}`);
        }

        console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);

        return isValid;
    }

    // Main validation method
    async validate() {
        console.log(colors.blue + 'Starting VPkg package validation...\n' + colors.reset);

        // Validate meta.yaml
        const metaValid = this.validateMetaYaml();

        // Validate templates only if meta.yaml is valid
        if (metaValid) {
            this.validateTemplates();
        }

        // Generate and return report
        return this.generateReport();
    }
}

// Main execution
async function main() {
    // Check if js-yaml is available
    try {
        require('js-yaml');
    } catch (error) {
        console.log(`${colors.red}[ERROR]${colors.reset} js-yaml package not found.`);
        console.log(`${colors.blue}[INFO]${colors.reset} Install it with: npm install js-yaml`);
        process.exit(1);
    }

    const validator = new PackageValidator();
    const isValid = await validator.validate();

    process.exit(isValid ? 0 : 1);
}

// Command line handling
if (require.main === module) {
    main().catch(error => {
        console.error(`${colors.red}[ERROR]${colors.reset} ${error.message}`);
        process.exit(1);
    });
}