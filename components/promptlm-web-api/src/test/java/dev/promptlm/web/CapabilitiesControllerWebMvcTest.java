/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CapabilitiesController.class)
class CapabilitiesControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CapabilitiesService capabilitiesService;

    @Test
    /** Verifies the endpoint returns an empty feature list when no capabilities are enabled. */
    void returnsEmptyCapabilitiesForOss() throws Exception {
        given(capabilitiesService.getFeatures()).willReturn(List.of());

        mockMvc.perform(get("/api/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.features").isArray())
                .andExpect(jsonPath("$.features", hasSize(0)));
    }

    @Test
    /** Verifies the endpoint returns configured capability identifiers. */
    void returnsConfiguredFeatures() throws Exception {
        given(capabilitiesService.getFeatures()).willReturn(List.of("evals"));

        mockMvc.perform(get("/api/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.features").isArray())
                .andExpect(jsonPath("$.features", hasItem("evals")));
    }
}
