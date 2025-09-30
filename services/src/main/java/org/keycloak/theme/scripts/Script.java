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

import java.util.Objects;
import java.util.Set;

/**
 * Represents a script that can be registered and enqueued in themes.
 * 
 * @author Keycloak team
 */
public class Script {
    
    public enum Type {
        /** Traditional JavaScript (default) */
        CLASSIC,
        /** ES6 module */
        MODULE,
        /** Import map for module dependencies */
        IMPORTMAP
    }
    
    public enum LoadStrategy {
        /** Load script in document head (default for modules and import maps) */
        HEAD,
        /** Load script before closing body tag */
        FOOTER,
        /** Preload the script but don't execute it immediately */
        PRELOAD
    }
    
    private final String handle;
    private final String src;
    private final Type type;
    private final LoadStrategy loadStrategy;
    private final Set<String> dependencies;
    private final String integrity;
    private final String crossorigin;
    private final boolean async;
    private final boolean defer;
    
    private Script(Builder builder) {
        this.handle = Objects.requireNonNull(builder.handle, "Handle cannot be null");
        this.src = Objects.requireNonNull(builder.src, "Source cannot be null");
        this.type = builder.type;
        this.loadStrategy = builder.loadStrategy;
        this.dependencies = Set.copyOf(builder.dependencies);
        this.integrity = builder.integrity;
        this.crossorigin = builder.crossorigin;
        this.async = builder.async;
        this.defer = builder.defer;
    }
    
    public String getHandle() {
        return handle;
    }
    
    public String getSrc() {
        return src;
    }
    
    public Type getType() {
        return type;
    }
    
    public LoadStrategy getLoadStrategy() {
        return loadStrategy;
    }
    
    public Set<String> getDependencies() {
        return dependencies;
    }
    
    public String getIntegrity() {
        return integrity;
    }
    
    public String getCrossorigin() {
        return crossorigin;
    }
    
    public boolean isAsync() {
        return async;
    }
    
    public boolean isDefer() {
        return defer;
    }
    
    /**
     * Generate the HTML script tag for this script.
     */
    public String toHtmlTag(String basePath) {
        StringBuilder sb = new StringBuilder();
        
        if (loadStrategy == LoadStrategy.PRELOAD) {
            sb.append("<link rel=\"");
            if (type == Type.MODULE) {
                sb.append("modulepreload");
            } else {
                sb.append("preload");
            }
            sb.append("\" href=\"").append(basePath).append("/").append(src).append("\"");
            if (type != Type.MODULE) {
                sb.append(" as=\"script\"");
            }
        } else {
            sb.append("<script");
            
            if (type == Type.MODULE) {
                sb.append(" type=\"module\"");
            } else if (type == Type.IMPORTMAP) {
                sb.append(" type=\"importmap\"");
            }
            
            if (type != Type.IMPORTMAP) {
                sb.append(" src=\"").append(basePath).append("/").append(src).append("\"");
            }
            
            if (integrity != null && !integrity.isEmpty()) {
                sb.append(" integrity=\"").append(integrity).append("\"");
            }
            
            if (crossorigin != null && !crossorigin.isEmpty()) {
                sb.append(" crossorigin=\"").append(crossorigin).append("\"");
            }
            
            if (async) {
                sb.append(" async");
            }
            
            if (defer) {
                sb.append(" defer");
            }
        }
        
        sb.append(">");
        
        if (loadStrategy != LoadStrategy.PRELOAD) {
            sb.append("</script>");
        }
        
        return sb.toString();
    }
    
    public static Builder builder(String handle, String src) {
        return new Builder(handle, src);
    }
    
    public static class Builder {
        private final String handle;
        private final String src;
        private Type type = Type.CLASSIC;
        private LoadStrategy loadStrategy = LoadStrategy.FOOTER;
        private Set<String> dependencies = Set.of();
        private String integrity;
        private String crossorigin;
        private boolean async = false;
        private boolean defer = false;
        
        private Builder(String handle, String src) {
            this.handle = handle;
            this.src = src;
        }
        
        public Builder type(Type type) {
            this.type = type;
            // Modules and import maps are typically loaded in head
            if ((type == Type.MODULE || type == Type.IMPORTMAP) && loadStrategy == LoadStrategy.FOOTER) {
                this.loadStrategy = LoadStrategy.HEAD;
            }
            return this;
        }
        
        public Builder loadStrategy(LoadStrategy loadStrategy) {
            this.loadStrategy = loadStrategy;
            return this;
        }
        
        public Builder dependencies(Set<String> dependencies) {
            this.dependencies = dependencies;
            return this;
        }
        
        public Builder integrity(String integrity) {
            this.integrity = integrity;
            return this;
        }
        
        public Builder crossorigin(String crossorigin) {
            this.crossorigin = crossorigin;
            return this;
        }
        
        public Builder async(boolean async) {
            this.async = async;
            return this;
        }
        
        public Builder defer(boolean defer) {
            this.defer = defer;
            return this;
        }
        
        public Script build() {
            return new Script(this);
        }
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Script script = (Script) o;
        return Objects.equals(handle, script.handle);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(handle);
    }
    
    @Override
    public String toString() {
        return "Script{" +
                "handle='" + handle + '\'' +
                ", src='" + src + '\'' +
                ", type=" + type +
                ", loadStrategy=" + loadStrategy +
                '}';
    }
}