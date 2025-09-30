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
import org.keycloak.theme.scripts.ScriptRegistry;

import java.util.List;

/**
 * FreeMarker method for enqueueing scripts in templates.
 * Usage: ${enqueueScript('handle')}
 * 
 * @author Keycloak team
 */
public class EnqueueScriptMethod implements TemplateMethodModelEx {
    
    private final ScriptRegistry scriptRegistry;
    
    public EnqueueScriptMethod(ScriptRegistry scriptRegistry) {
        this.scriptRegistry = scriptRegistry;
    }
    
    @Override
    public Object exec(List arguments) throws TemplateModelException {
        if (arguments.size() < 1) {
            throw new TemplateModelException("enqueueScript requires 1 argument: handle");
        }
        
        String handle = getStringArgument(arguments, 0, "handle");
        
        try {
            scriptRegistry.enqueueScript(handle);
        } catch (IllegalArgumentException e) {
            throw new TemplateModelException("Failed to enqueue script '" + handle + "': " + e.getMessage(), e);
        }
        
        return "";
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
}