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

package dev.promptlm.domain.promptspec;

public interface CommonBuilderSteps {
    public interface BuildStep<R> {
        R build();
    }

    interface ModelStep<T> {
        T withModel(String model);
    }
    interface UrlStep<T> {
        T withUrl(String url);
    }
    /***
     * {@code T} declares the next Step after this.
     */
    public interface VendorModelStep<T> {
        UrlStep<T> withVendor(String vendor);
        VendorModelStep<T> withUrl(String vendorModel);
        T withModel(String model);
    }


}
