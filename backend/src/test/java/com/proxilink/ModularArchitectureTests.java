package com.proxilink;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularArchitectureTests {

    @Test
    void verifiesModularStructure() {
        ApplicationModules.of(ProxilinkBackendApplication.class).verify();
    }
}