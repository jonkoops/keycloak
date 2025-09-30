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

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.Set;

/**
 * Unit tests for the ScriptRegistry class.
 * 
 * @author Keycloak team
 */
public class ScriptRegistryTest {
    
    @Test
    public void testRegisterScript() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("test-script", "js/test.js");
        
        assertTrue(registry.isRegistered("test-script"));
        assertEquals("js/test.js", registry.getScript("test-script").getSrc());
    }
    
    @Test
    public void testRegisterScriptModule() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScriptModule("test-module", "js/module.js");
        
        assertTrue(registry.isRegistered("test-module"));
        Script script = registry.getScript("test-module");
        assertEquals(Script.Type.MODULE, script.getType());
        assertEquals(Script.LoadStrategy.HEAD, script.getLoadStrategy());
    }
    
    @Test
    public void testEnqueueScript() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("test-script", "js/test.js");
        registry.enqueueScript("test-script");
        
        assertTrue(registry.isEnqueued("test-script"));
        assertEquals(1, registry.getEnqueuedScripts().size());
    }
    
    @Test
    public void testDependencyResolution() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("dependency", "js/dep.js");
        registry.registerScriptModule("main", "js/main.js", Set.of("dependency"));
        
        registry.enqueueScript("main");
        
        assertTrue(registry.isEnqueued("dependency"));
        assertTrue(registry.isEnqueued("main"));
        assertEquals(2, registry.getEnqueuedScripts().size());
    }
    
    @Test
    public void testScriptHtmlGeneration() {
        Script classicScript = Script.builder("test", "js/test.js")
                .type(Script.Type.CLASSIC)
                .build();
        
        String html = classicScript.toHtmlTag("/resources");
        assertTrue(html.contains("src=\"/resources/js/test.js\""));
        assertFalse(html.contains("type=\"module\""));
    }
    
    @Test
    public void testModuleScriptHtmlGeneration() {
        Script moduleScript = Script.builder("test-module", "js/module.js")
                .type(Script.Type.MODULE)
                .integrity("sha384-test")
                .crossorigin("anonymous")
                .build();
        
        String html = moduleScript.toHtmlTag("/resources");
        assertTrue(html.contains("type=\"module\""));
        assertTrue(html.contains("integrity=\"sha384-test\""));
        assertTrue(html.contains("crossorigin=\"anonymous\""));
    }
    
    @Test
    public void testPreloadScriptHtmlGeneration() {
        Script preloadScript = Script.builder("preload-test", "js/preload.js")
                .loadStrategy(Script.LoadStrategy.PRELOAD)
                .build();
        
        String html = preloadScript.toHtmlTag("/resources");
        assertTrue(html.contains("<link rel=\"preload\""));
        assertTrue(html.contains("as=\"script\""));
    }
    
    @Test
    public void testModulePreloadHtmlGeneration() {
        Script modulePreload = Script.builder("module-preload", "js/module.js")
                .type(Script.Type.MODULE)
                .loadStrategy(Script.LoadStrategy.PRELOAD)
                .build();
        
        String html = modulePreload.toHtmlTag("/resources");
        assertTrue(html.contains("<link rel=\"modulepreload\""));
        assertFalse(html.contains("as=\"script\""));
    }
    
    @Test
    public void testRenderScriptsByLoadStrategy() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("head-script", "js/head.js");
        registry.registerScript(Script.builder("footer-script", "js/footer.js")
                .loadStrategy(Script.LoadStrategy.FOOTER)
                .build());
        
        registry.enqueueScript("head-script");
        registry.enqueueScript("footer-script");
        
        String headHtml = registry.renderScripts(Script.LoadStrategy.HEAD, "/resources");
        String footerHtml = registry.renderScripts(Script.LoadStrategy.FOOTER, "/resources");
        
        assertFalse(headHtml.contains("js/footer.js"));
        assertTrue(footerHtml.contains("js/footer.js"));
    }
    
    @Test(expected = IllegalArgumentException.class)
    public void testRegisterDuplicateScript() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("duplicate", "js/first.js");
        registry.registerScript("duplicate", "js/second.js");
    }
    
    @Test(expected = IllegalArgumentException.class)
    public void testEnqueueUnregisteredScript() {
        ScriptRegistry registry = new ScriptRegistry();
        registry.enqueueScript("not-registered");
    }
    
    @Test
    public void testClearEnqueued() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("test", "js/test.js");
        registry.enqueueScript("test");
        
        assertTrue(registry.isEnqueued("test"));
        
        registry.clearEnqueued();
        
        assertFalse(registry.isEnqueued("test"));
        assertTrue(registry.isRegistered("test")); // Registration should remain
    }
    
    @Test
    public void testDeregisterScript() {
        ScriptRegistry registry = new ScriptRegistry();
        
        registry.registerScript("test", "js/test.js");
        registry.enqueueScript("test");
        
        Script removed = registry.deregisterScript("test");
        
        assertNotNull(removed);
        assertEquals("test", removed.getHandle());
        assertFalse(registry.isRegistered("test"));
        assertFalse(registry.isEnqueued("test"));
    }
}