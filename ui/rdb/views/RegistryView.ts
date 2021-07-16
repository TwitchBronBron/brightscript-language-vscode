class RegistryView {
    public formatValues(values) {
        let input = values;
        Object.keys(values).map((key) => {
            if (typeof values[key] == 'object') {
                input[key] = this.formatValues(values[key]);
            } else if (typeof values[key] == 'string') {
                try {
                    // Try and parse it to see if it's json
                    values[key] = JSON.parse(values[key]);
                } catch(e) {
                    // If we fail we leave it unchanged
                }
            }
        });

        return input;
    }
}

const registryView = new RegistryView();

export {
    registryView
}
