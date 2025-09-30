/*
 * Copyright 2024 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.keycloak.theme.beans;

import freemarker.template.SimpleScalar;
import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModelException;
import org.keycloak.theme.scripts.Script;
import org.keycloak.theme.scripts.ScriptRegistry;

import java.util.List;
import java.util.Set;

/**
 * FreeMarker method for registering scripts in templates.
 * Usage: ${registerScript('handle', 'path/to/script.js')}
 * Usage: ${registerScript('handle', 'path/to/script.js', 'module')}
 * Usage: ${registerScript('handle', 'path/to/script.js', 'module', 'head')}
 * 
 * @author Keycloak team
 */
public class RegisterScriptMethod implements TemplateMethodModelEx {
    
    private final ScriptRegistry scriptRegistry;
    
    public RegisterScriptMethod(ScriptRegistry scriptRegistry) {
        this.scriptRegistry = scriptRegistry;
    }
    
    @Override
    public Object exec(List arguments) throws TemplateModelException {
        if (arguments.size() < 2) {
            throw new TemplateModelException("registerScript requires at least 2 arguments: handle and src");
        }
        
        String handle = getStringArgument(arguments, 0, "handle");
        String src = getStringArgument(arguments, 1, "src");
        
        Script.Builder builder = Script.builder(handle, src);
        
        // Optional third argument: type (classic, module, importmap)
        if (arguments.size() > 2) {
            String typeStr = getStringArgument(arguments, 2, "type");
            Script.Type type = parseType(typeStr);
            builder.type(type);
        }
        
        // Optional fourth argument: load strategy (head, footer, preload)
        if (arguments.size() > 3) {
            String strategyStr = getStringArgument(arguments, 3, "loadStrategy");
            Script.LoadStrategy strategy = parseLoadStrategy(strategyStr);
            builder.loadStrategy(strategy);
        }
        
        // Optional fifth argument: integrity
        if (arguments.size() > 4) {
            String integrity = getStringArgument(arguments, 4, "integrity");
            if (integrity != null && !integrity.isEmpty()) {
                builder.integrity(integrity);
            }
        }
        
        // Optional sixth argument: crossorigin
        if (arguments.size() > 5) {
            String crossorigin = getStringArgument(arguments, 5, "crossorigin");
            if (crossorigin != null && !crossorigin.isEmpty()) {
                builder.crossorigin(crossorigin);
            }
        }
        
        try {
            scriptRegistry.registerScript(builder.build());
        } catch (IllegalArgumentException e) {
            // Script already registered - ignore silently or log warning
            // This allows templates to safely call registerScript multiple times
        }
        
        return "";
    }
    
    private String getStringArgument(List arguments, int index, String paramName) throws TemplateModelException {
        if (index >= arguments.size()) {
            return null;
        }
        
        Object arg = arguments.get(index);
        if (arg instanceof SimpleScalar) {
            return ((SimpleScalar) arg).getAsString();
        } else if (arg != null) {
            return arg.toString();
        }
        return null;
    }
    
    private Script.Type parseType(String typeStr) throws TemplateModelException {
        if (typeStr == null || typeStr.isEmpty()) {
            return Script.Type.CLASSIC;
        }
        
        return switch (typeStr.toLowerCase()) {
            case "classic", "text/javascript", "javascript", "js" -> Script.Type.CLASSIC;
            case "module", "text/javascript+module", "es6" -> Script.Type.MODULE;
            case "importmap", "text/importmap", "import-map" -> Script.Type.IMPORTMAP;
            default -> throw new TemplateModelException("Invalid script type: " + typeStr + 
                    ". Valid types are: classic, module, importmap");
        };
    }
    
    private Script.LoadStrategy parseLoadStrategy(String strategyStr) throws TemplateModelException {
        if (strategyStr == null || strategyStr.isEmpty()) {
            return Script.LoadStrategy.FOOTER;
        }
        
        return switch (strategyStr.toLowerCase()) {
            case "head", "header" -> Script.LoadStrategy.HEAD;
            case "footer", "body", "end" -> Script.LoadStrategy.FOOTER;
            case "preload", "pre-load" -> Script.LoadStrategy.PRELOAD;
            default -> throw new TemplateModelException("Invalid load strategy: " + strategyStr + 
                    ". Valid strategies are: head, footer, preload");
        };
    }
}