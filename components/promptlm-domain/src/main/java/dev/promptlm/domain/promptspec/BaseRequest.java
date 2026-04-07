package dev.promptlm.domain.promptspec;

abstract class BaseRequest implements Request {
    private String vendor;
    private String model;
    private String url;
    private String type;

    @Override
    public String getVendor() {
        return vendor;
    }

    @Override
    public String getModel() {
        return model;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    @Override
    public String getUrl() {
        return url;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
