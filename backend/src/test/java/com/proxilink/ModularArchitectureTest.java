package com.proxilink;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularArchitectureTest {

    @Test
    void verifiesModularStructure() {
        ApplicationModules.of(ProxilinkBackendApplication.class).verify();
    }
}
