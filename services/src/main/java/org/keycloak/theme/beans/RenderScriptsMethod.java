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

/**
 * FreeMarker method for rendering enqueued scripts in templates.
 * Usage: ${renderScripts('head')} or ${renderScripts('footer')}
 * Usage: ${renderScripts('head', 'module')} to render only modules in head
 * 
 * @author Keycloak team
 */
public class RenderScriptsMethod implements TemplateMethodModelEx {
    
    private final ScriptRegistry scriptRegistry;
    private final String basePath;
    
    public RenderScriptsMethod(ScriptRegistry scriptRegistry, String basePath) {
        this.scriptRegistry = scriptRegistry;
        this.basePath = basePath;
    }
    
    @Override
    public Object exec(List arguments) throws TemplateModelException {
        if (arguments.size() < 1) {
            throw new TemplateModelException("renderScripts requires at least 1 argument: loadStrategy");
        }
        
        String loadStrategyStr = getStringArgument(arguments, 0, "loadStrategy");
        Script.LoadStrategy loadStrategy = parseLoadStrategy(loadStrategyStr);
        
        if (arguments.size() > 1) {
            String typeStr = getStringArgument(arguments, 1, "type");
            Script.Type type = parseType(typeStr);
            return scriptRegistry.renderScripts(loadStrategy, type, basePath);
        } else {
            return scriptRegistry.renderScripts(loadStrategy, basePath);
        }
    }
    
    private String getStringArgument(List arguments, int index, String paramName) throws TemplateModelException {
        if (index >= arguments.size()) {
            throw new TemplateModelException("Missing required argument: " + paramName);
        }
        
        Object arg = arguments.get(index);
        if (arg instanceof SimpleScalar) {
            return ((SimpleScalar) arg).getAsString();
        } else if (arg != null) {
            return arg.toString();
        }
        
        throw new TemplateModelException("Argument " + paramName + " must be a string");
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
}