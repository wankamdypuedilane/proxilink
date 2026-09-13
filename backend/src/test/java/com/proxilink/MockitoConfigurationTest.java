package com.proxilink;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Verifies that the unit testing stack is correctly wired: JUnit Jupiter drives the test,
 * Mockito creates and injects the double, and AssertJ performs the assertion.
 *
 * The collaborators below exist only for this verification and are intentionally kept
 * inside the test file, so that no production code is introduced.
 */
@ExtendWith(MockitoExtension.class)
class MockitoConfigurationTest {

	@Mock
	private TestEnvironmentProbe probe;

	@InjectMocks
	private TestEnvironmentReporter reporter;

	@Test
	void reportsTheValueProvidedByTheMock() {
		when(probe.describeEnvironment()).thenReturn("mockito");

		String report = reporter.report();

		assertThat(report).isEqualTo("test environment: mockito");
		verify(probe).describeEnvironment();
	}

	interface TestEnvironmentProbe {

		String describeEnvironment();

	}

	static class TestEnvironmentReporter {

		private final TestEnvironmentProbe probe;

		TestEnvironmentReporter(TestEnvironmentProbe probe) {
			this.probe = probe;
		}

		String report() {
			return "test environment: " + probe.describeEnvironment();
		}

	}

}
