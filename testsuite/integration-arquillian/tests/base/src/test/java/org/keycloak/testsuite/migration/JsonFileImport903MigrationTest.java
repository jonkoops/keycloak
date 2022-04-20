/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates
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
package org.keycloak.testsuite.migration;

import org.junit.Test;
import org.keycloak.testsuite.arquillian.annotation.AuthServerContainerExclude;
import org.keycloak.testsuite.arquillian.annotation.AuthServerContainerExclude.AuthServer;

/**
 * Tests that we can import json file from previous version.  MigrationTest only tests DB.
 */
@AuthServerContainerExclude(AuthServer.REMOTE)
public class JsonFileImport903MigrationTest extends AbstractJsonFileImportMigrationTest {

    @Override
    protected String getTestRealmsJsonPath() {
        return "/migration-test/migration-realm-9.0.3.json";
    }

    @Test
    public void migration9_0_3Test() throws Exception {
        checkRealmsImported();
        testMigrationTo12_x(true);
        testMigrationTo18_x();
    }

}
