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

package org.keycloak.theme.scripts;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Registry for managing script registration and enqueueing in themes.
 * Similar to WordPress wp_register_script() and wp_enqueue_script() functionality.
 * 
 * @author Keycloak team
 */
public class ScriptRegistry {
    
    private final Map<String, Script> registeredScripts = new HashMap<>();
    private final Set<String> enqueuedScripts = new LinkedHashSet<>();
    
    /**
     * Register a script for use in templates.
     * 
     * @param script the script to register
     * @throws IllegalArgumentException if a script with the same handle is already registered
     */
    public void registerScript(Script script) {
        String handle = script.getHandle();
        if (registeredScripts.containsKey(handle)) {
            throw new IllegalArgumentException("Script with handle '" + handle + "' is already registered");
        }
        registeredScripts.put(handle, script);
    }
    
    /**
     * Register a script for use in templates. This is a convenience method for simple scripts.
     * 
     * @param handle unique identifier for the script
     * @param src path to the script relative to theme resources
     */
    public void registerScript(String handle, String src) {
        registerScript(Script.builder(handle, src).build());
    }
    
    /**
     * Register a script module for use in templates.
     * 
     * @param handle unique identifier for the script module
     * @param src path to the script relative to theme resources
     */
    public void registerScriptModule(String handle, String src) {
        registerScript(Script.builder(handle, src)
                .type(Script.Type.MODULE)
                .build());
    }
    
    /**
     * Register a script module for use in templates with dependencies.
     * 
     * @param handle unique identifier for the script module
     * @param src path to the script relative to theme resources
     * @param dependencies set of script handles this script depends on
     */
    public void registerScriptModule(String handle, String src, Set<String> dependencies) {
        registerScript(Script.builder(handle, src)
                .type(Script.Type.MODULE)
                .dependencies(dependencies)
                .build());
    }
    
    /**
     * Enqueue a previously registered script for output.
     * 
     * @param handle the handle of the script to enqueue
     * @throws IllegalArgumentException if no script with the given handle is registered
     */
    public void enqueueScript(String handle) {
        if (!registeredScripts.containsKey(handle)) {
            throw new IllegalArgumentException("No script registered with handle '" + handle + "'");
        }
        
        Script script = registeredScripts.get(handle);
        
        // Enqueue dependencies first
        for (String dependency : script.getDependencies()) {
            if (!enqueuedScripts.contains(dependency)) {
                enqueueScript(dependency);
            }
        }
        
        enqueuedScripts.add(handle);
    }
    
    /**
     * Check if a script is registered.
     * 
     * @param handle the script handle to check
     * @return true if the script is registered
     */
    public boolean isRegistered(String handle) {
        return registeredScripts.containsKey(handle);
    }
    
    /**
     * Check if a script is enqueued.
     * 
     * @param handle the script handle to check
     * @return true if the script is enqueued
     */
    public boolean isEnqueued(String handle) {
        return enqueuedScripts.contains(handle);
    }
    
    /**
     * Get all registered scripts.
     * 
     * @return collection of all registered scripts
     */
    public Collection<Script> getRegisteredScripts() {
        return registeredScripts.values();
    }
    
    /**
     * Get all enqueued scripts ordered by load strategy and dependencies.
     * 
     * @return list of enqueued scripts in the order they should be rendered
     */
    public List<Script> getEnqueuedScripts() {
        List<Script> scripts = new ArrayList<>();
        for (String handle : enqueuedScripts) {
            Script script = registeredScripts.get(handle);
            if (script != null) {
                scripts.add(script);
            }
        }
        return scripts;
    }
    
    /**
     * Get enqueued scripts filtered by load strategy.
     * 
     * @param loadStrategy the load strategy to filter by
     * @return list of enqueued scripts with the specified load strategy
     */
    public List<Script> getEnqueuedScripts(Script.LoadStrategy loadStrategy) {
        return getEnqueuedScripts().stream()
                .filter(script -> script.getLoadStrategy() == loadStrategy)
                .toList();
    }
    
    /**
     * Get enqueued scripts filtered by type.
     * 
     * @param type the script type to filter by
     * @return list of enqueued scripts with the specified type
     */
    public List<Script> getEnqueuedScripts(Script.Type type) {
        return getEnqueuedScripts().stream()
                .filter(script -> script.getType() == type)
                .toList();
    }
    
    /**
     * Generate HTML for all enqueued scripts with the specified load strategy.
     * 
     * @param loadStrategy the load strategy to render
     * @param basePath the base path for script sources
     * @return HTML string containing all script tags
     */
    public String renderScripts(Script.LoadStrategy loadStrategy, String basePath) {
        StringBuilder sb = new StringBuilder();
        
        List<Script> scripts = getEnqueuedScripts(loadStrategy);
        
        // Render import maps first
        for (Script script : scripts) {
            if (script.getType() == Script.Type.IMPORTMAP) {
                sb.append(script.toHtmlTag(basePath)).append("\n");
            }
        }
        
        // Then render other scripts
        for (Script script : scripts) {
            if (script.getType() != Script.Type.IMPORTMAP) {
                sb.append(script.toHtmlTag(basePath)).append("\n");
            }
        }
        
        return sb.toString();
    }
    
    /**
     * Generate HTML for all enqueued scripts with the specified load strategy and type.
     * 
     * @param loadStrategy the load strategy to render
     * @param type the script type to render
     * @param basePath the base path for script sources
     * @return HTML string containing all script tags
     */
    public String renderScripts(Script.LoadStrategy loadStrategy, Script.Type type, String basePath) {
        StringBuilder sb = new StringBuilder();
        
        for (Script script : getEnqueuedScripts()) {
            if (script.getLoadStrategy() == loadStrategy && script.getType() == type) {
                sb.append(script.toHtmlTag(basePath)).append("\n");
            }
        }
        
        return sb.toString();
    }
    
    /**
     * Clear all enqueued scripts. Registered scripts remain available for enqueueing.
     */
    public void clearEnqueued() {
        enqueuedScripts.clear();
    }
    
    /**
     * Clear all registered and enqueued scripts.
     */
    public void clear() {
        registeredScripts.clear();
        enqueuedScripts.clear();
    }
    
    /**
     * Get a registered script by handle.
     * 
     * @param handle the script handle
     * @return the script or null if not found
     */
    public Script getScript(String handle) {
        return registeredScripts.get(handle);
    }
    
    /**
     * Remove a registered script. If the script is enqueued, it will also be removed from the queue.
     * 
     * @param handle the handle of the script to remove
     * @return the removed script or null if not found
     */
    public Script deregisterScript(String handle) {
        enqueuedScripts.remove(handle);
        return registeredScripts.remove(handle);
    }
}