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