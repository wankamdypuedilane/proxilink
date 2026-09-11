package com.proxilink;

import org.springframework.boot.SpringApplication;

public class TestProxilinkBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(ProxilinkBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
