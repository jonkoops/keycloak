# Enhanced Script Registration System for Keycloak Themes

This document describes the new script registration and enqueueing system implemented for Keycloak themes, providing a modern alternative to directly embedding `<script>` tags in templates.

## Overview

The new system introduces a WordPress-inspired API that allows themes to:

- Register scripts with handles for reuse
- Enqueue scripts only when needed
- Manage script dependencies automatically
- Add security attributes (integrity, crossorigin)
- Control script placement (head vs footer)
- Support modern JavaScript modules
- Prevent duplicate script loading

## Core Components

### ScriptRegistry

The central registry that manages script registration and enqueueing:

```java
ScriptRegistry registry = new ScriptRegistry();

// Register a classic script
registry.registerScript("my-script", "js/my-script.js");

// Register an ES6 module
registry.registerScriptModule("my-module", "js/my-module.js");

// Enqueue scripts for output
registry.enqueueScript("my-script");
registry.enqueueScript("my-module");
```

### Script Class

Represents a script with all its metadata:

```java
Script script = Script.builder("handle", "path/to/script.js")
    .type(Script.Type.MODULE)
    .loadStrategy(Script.LoadStrategy.HEAD)
    .integrity("sha384-...")
    .crossorigin("anonymous")
    .dependencies(Set.of("dependency1", "dependency2"))
    .build();
```

## Template Integration

The system integrates with FreeMarker templates through three new methods:

### registerScript()

Register a script for potential use:

```ftl
<#-- Basic registration -->
${registerScript('my-script', 'js/my-script.js')}

<#-- Register with type and placement -->
${registerScript('my-module', 'js/module.js', 'module', 'head')}

<#-- Register with security attributes -->
${registerScript('secure-script', 'js/secure.js', 'module', 'head', 'sha384-...', 'anonymous')}
```

### enqueueScript()

Enqueue a registered script for output:

```ftl
${enqueueScript('my-script')}
${enqueueScript('my-module')}
```

### renderScripts()

Output enqueued scripts at the appropriate location:

```ftl
<#-- In <head> section -->
${renderScripts('head')}

<#-- Before </body> tag -->
${renderScripts('footer')}

<#-- Render only specific types -->
${renderScripts('head', 'module')}
```

## Usage Examples

### Basic Usage

```ftl
<#-- Register scripts -->
${registerScript('form-validator', 'js/form-validator.js')}
${registerScript('analytics', 'js/analytics.js')}

<#-- Conditionally enqueue -->
${enqueueScript('form-validator')}
<#if user_consent_analytics?? && user_consent_analytics>
    ${enqueueScript('analytics')}
</#if>

<#-- In template head -->
${renderScripts('head')}

<#-- Before closing body -->
${renderScripts('footer')}
```

### Module Dependencies

```ftl
<#-- Register modules with dependencies -->
${registerScript('utils', 'js/utils.js', 'module', 'head')}
${registerScript('validator', 'js/validator.js', 'module', 'head')}
${registerScript('main', 'js/main.js', 'module', 'head')}

<#-- Dependencies are automatically resolved -->
${enqueueScript('main')} <#-- Will enqueue utils and validator too -->
```

### Security Features

```ftl
<#-- Scripts with integrity checking -->
${registerScript('secure-lib', 'js/secure-lib.js', 'module', 'head', 
    'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC',
    'anonymous')}

${enqueueScript('secure-lib')}
```

### Preloading

```ftl
<#-- Preload critical scripts -->
${registerScript('critical-module', 'js/critical.js', 'module', 'preload')}
${enqueueScript('critical-module')}

<#-- Renders as: <link rel="modulepreload" href="..."> -->
${renderScripts('preload')}
```

## Migration from Legacy System

### Before (legacy)

```ftl
<#if properties.scripts?has_content>
    <#list properties.scripts?split(' ') as script>
        <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
    </#list>
</#if>
```

### After (enhanced)

```ftl
<#-- Register theme scripts -->
<#if properties.scripts?has_content>
    <#list properties.scripts?split(' ') as script>
        ${registerScript('theme-script-${script?index}', script)}
        ${enqueueScript('theme-script-${script?index}')}
    </#list>
</#if>

<#-- Render where appropriate -->
${renderScripts('head')}
${renderScripts('footer')}
```

## Script Types

### Script.Type.CLASSIC
Traditional JavaScript files (default):
```html
<script src="/resources/js/script.js" type="text/javascript"></script>
```

### Script.Type.MODULE
ES6 modules:
```html
<script src="/resources/js/module.js" type="module"></script>
```

### Script.Type.IMPORTMAP
Import maps for module resolution:
```html
<script type="importmap">{"imports": {...}}</script>
```

## Load Strategies

### Script.LoadStrategy.HEAD
Scripts loaded in document head (default for modules):
- Good for modules and dependencies
- Blocks rendering until loaded
- Better for critical functionality

### Script.LoadStrategy.FOOTER
Scripts loaded before closing body tag (default for classic scripts):
- Non-blocking page render
- Good for non-critical functionality
- Traditional placement

### Script.LoadStrategy.PRELOAD
Scripts preloaded but not executed:
- Improves performance for later-needed scripts
- Uses `<link rel="preload">` or `<link rel="modulepreload">`

## Benefits

1. **Prevents Duplicate Loading**: Scripts registered once can be enqueued multiple times safely
2. **Dependency Management**: Automatic resolution of script dependencies
3. **Security**: Built-in support for integrity and CORS attributes
4. **Performance**: Support for preloading and optimal placement
5. **Modern Standards**: First-class support for ES6 modules and import maps
6. **Backwards Compatibility**: Existing themes continue to work
7. **Conditional Loading**: Scripts only loaded when actually needed

## Best Practices

1. **Register Early**: Register all potential scripts at the top of templates
2. **Enqueue Conditionally**: Only enqueue scripts that are actually needed
3. **Use Modules**: Prefer ES6 modules for new JavaScript code
4. **Add Security**: Include integrity hashes for external scripts
5. **Optimize Placement**: Use HEAD for critical scripts, FOOTER for others
6. **Handle Dependencies**: Declare dependencies explicitly for proper loading order

## Backwards Compatibility

The system maintains full backwards compatibility:
- Existing `properties.scripts` continues to work
- Legacy `scripts` template variable still supported
- Inline scripts remain unchanged
- No breaking changes to existing themes

## Future Enhancements

Potential future improvements could include:
- Automatic integrity hash generation
- Script bundling and minification
- Dynamic import support
- Service Worker integration
- Advanced CSP integration

## Files Modified/Added

### New Files:
- `services/src/main/java/org/keycloak/theme/scripts/Script.java`
- `services/src/main/java/org/keycloak/theme/scripts/ScriptRegistry.java`
- `services/src/main/java/org/keycloak/theme/beans/RegisterScriptMethod.java`
- `services/src/main/java/org/keycloak/theme/beans/EnqueueScriptMethod.java`
- `services/src/main/java/org/keycloak/theme/beans/RenderScriptsMethod.java`
- `services/src/test/java/org/keycloak/theme/scripts/ScriptRegistryTest.java`

### Modified Files:
- `services/src/main/java/org/keycloak/forms/login/freemarker/FreeMarkerLoginFormsProvider.java`
- `themes/src/main/resources/theme/base/login/template.ftl`

### Example Theme:
- `themes/src/main/resources/theme/example-enhanced/login/theme.properties`
- `themes/src/main/resources/theme/example-enhanced/login/login.ftl`
- `themes/src/main/resources/theme/example-enhanced/login/resources/js/login-form-validator.js`
- `themes/src/main/resources/theme/example-enhanced/login/resources/js/password-strength.js`