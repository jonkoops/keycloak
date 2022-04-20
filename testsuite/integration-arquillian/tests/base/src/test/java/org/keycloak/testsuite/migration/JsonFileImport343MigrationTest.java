/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
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
import org.keycloak.common.Profile;
import org.keycloak.testsuite.ProfileAssume;
import org.keycloak.testsuite.arquillian.annotation.AuthServerContainerExclude;
import org.keycloak.testsuite.arquillian.annotation.AuthServerContainerExclude.AuthServer;

/**
 * Tests that we can import json file from previous version.  MigrationTest only tests DB.
 *
 * @author <a href="mailto:bill@burkecentral.com">Bill Burke</a>
 * @version $Revision: 1 $
 */
@AuthServerContainerExclude(value = {AuthServer.REMOTE})
public class JsonFileImport343MigrationTest extends AbstractJsonFileImportMigrationTest {

    @Override
    protected String getTestRealmsJsonPath() {
        return "/migration-test/migration-realm-3.4.3.Final.json";
    }

    @Test
    public void migration3_4_3Test() throws Exception {
        checkRealmsImported();
        testMigrationTo4_x(ProfileAssume.isFeatureEnabled(Profile.Feature.AUTHORIZATION), false);
        testMigrationTo5_x();
        testMigrationTo6_x();
        testMigrationTo7_x(ProfileAssume.isFeatureEnabled(Profile.Feature.AUTHORIZATION));
        testMigrationTo8_x();
        testMigrationTo9_x();
        testMigrationTo12_x(true);
        testMigrationTo18_x();
    }

}
