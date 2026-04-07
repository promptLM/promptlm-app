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

abstract class BaseRequestBuilder<T extends Request, B extends BaseRequestBuilder<T, B>>
    implements CommonBuilderSteps.ModelStep<B>, CommonBuilderSteps.UrlStep<B> {

    @Override
    public B withUrl(String url) {
        getInstance().setUrl(url);
        return (B) this;
    }

    public CommonBuilderSteps.UrlStep<B> withVendor(String vendor) {
        this.getInstance().setVendor(vendor);
        return this;
    }

    protected abstract T getInstance();

    @Override
    public B withModel(String model) {
        getInstance().setModel(model);
        return (B) this;
    }

}