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
